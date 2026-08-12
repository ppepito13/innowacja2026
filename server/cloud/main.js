const crypto = require('node:crypto');

const QR_SECRET = process.env.QR_HMAC_SECRET;

const TOKEN_VERSION = 'v1';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(input) {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function signId(objectId) {
  return base64url(crypto.createHmac('sha256', QR_SECRET).update(objectId).digest());
}

function buildToken(objectId) {
  return `${TOKEN_VERSION}.${base64url(objectId)}.${signId(objectId)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [version, encodedId, signature] = parts;
  if (version !== TOKEN_VERSION || !encodedId || !signature) return null;

  let objectId;
  try {
    objectId = base64urlDecode(encodedId);
  } catch (err) {
    return null;
  }
  if (!objectId) return null;

  const expected = signId(objectId);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length) return null;
  if (!crypto.timingSafeEqual(given, want)) return null;

  return objectId;
}

Parse.Cloud.define('generateQrToken', async (request) => {
  const { registrationId } = request.params;
  if (!registrationId || typeof registrationId !== 'string') {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'registrationId is required.');
  }

  const query = new Parse.Query('Registration');
  const registration = await query.get(registrationId, { useMasterKey: true });

  return {
    token: buildToken(registration.id),
    registrationId: registration.id,
  };
});

Parse.Cloud.define('checkInByToken', async (request) => {
  const { eventId } = request.params;
  const objectId = verifyToken(request.params.token);
  if (!objectId) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Invalid or forged QR code.');
  }

  const query = new Parse.Query('Registration');
  let registration;
  try {
    registration = await query.get(objectId, { useMasterKey: true });
  } catch (err) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Registration not found.');
  }

  const eventPointer = registration.get('event');
  const registrationEventId = eventPointer ? eventPointer.id : null;

  const participant = {
    objectId: registration.id,
    formData: registration.get('formData') ?? {},
    status: registration.get('status'),
    eventId: registrationEventId,
  };

  if (eventId && registrationEventId !== eventId) {
    return { result: 'wrong_event', participant };
  }

  if (registration.get('status') !== 'approved') {
    return { result: 'not_approved', participant };
  }

  if (registration.get('isCheckedIn')) {
    const existing = registration.get('checkInTime');
    return {
      result: 'already_checked_in',
      checkInTime: existing instanceof Date ? existing.toISOString() : (existing ?? null),
      participant: { ...participant, isCheckedIn: true },
    };
  }

  const now = new Date();
  registration.set('isCheckedIn', true);
  registration.set('checkInTime', now);
  await registration.save(null, { useMasterKey: true });

  return {
    result: 'checked_in',
    checkInTime: now.toISOString(),
    participant: { ...participant, isCheckedIn: true },
  };
});

Parse.Cloud.beforeSave('Registration', (request) => {
  const registration = request.object;
  if (registration.isNew() && registration.get('isCheckedIn') === undefined) {
    registration.set('isCheckedIn', false);
  }
});

function signUnregisterId(objectId) {
  return base64url(
    crypto.createHmac('sha256', QR_SECRET).update(`unregister:${objectId}`).digest(),
  );
}

function buildUnregisterToken(objectId) {
  return `${TOKEN_VERSION}.${base64url(objectId)}.${signUnregisterId(objectId)}`;
}

function verifyUnregisterToken(token) {
  if (typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [version, encodedId, signature] = parts;
  if (version !== TOKEN_VERSION || !encodedId || !signature) return null;

  let objectId;
  try {
    objectId = base64urlDecode(encodedId);
  } catch (err) {
    return null;
  }
  if (!objectId) return null;

  const expected = signUnregisterId(objectId);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length) return null;
  if (!crypto.timingSafeEqual(given, want)) return null;

  return objectId;
}

Parse.Cloud.define('generateUnregisterToken', async (request) => {
  const { registrationId } = request.params;
  if (!registrationId || typeof registrationId !== 'string') {
    throw new Parse.Error(Parse.Error.INVALID_QUERY, 'registrationId is required.');
  }

  const query = new Parse.Query('Registration');
  const registration = await query.get(registrationId, { useMasterKey: true });

  return {
    token: buildUnregisterToken(registration.id),
    registrationId: registration.id,
  };
});

Parse.Cloud.define('getUnregisterInfo', async (request) => {
  const objectId = verifyUnregisterToken(request.params.token);
  if (!objectId) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Invalid or forged link.');
  }

  const query = new Parse.Query('Registration');
  query.include('event');

  let registration;
  try {
    registration = await query.get(objectId, { useMasterKey: true });
  } catch (err) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Registration not found.');
  }

  return {
    eventTitle: registration.get('event')?.get('title') ?? '',
    status: registration.get('status'),
  };
});

Parse.Cloud.define('unregisterParticipant', async (request) => {
  const objectId = verifyUnregisterToken(request.params.token);
  if (!objectId) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Invalid or forged link.');
  }

  const query = new Parse.Query('Registration');
  let registration;
  try {
    registration = await query.get(objectId, { useMasterKey: true });
  } catch (err) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Registration not found.');
  }

  if (registration.get('status') === 'cancelled') {
    return { alreadyCancelled: true };
  }

  registration.set('status', 'cancelled');
  await registration.save(null, { useMasterKey: true });
  return { success: true };
});
