/**
 * beforeFind na Registration — odpala się przy każdym query na rejestracje.
 * Sprawdza czy zalogowany user ma dostęp do eventu którego dotyczą rejestracje.
 * Admin widzi wszystkie. Organizer tylko rejestracje swoich eventów.
 */
Parse.Cloud.beforeFind('Registration', async (request) => {
  const user = request.user;

  if (!user) {
    throw new Parse.Error(Parse.Error.SESSION_MISSING, 'Unauthorized');
  }

  if (user.get('role') === 'Admin') {
    return;
  }

  // Wyciągnij eventId z filtra where
  const where = request.query._where;
  const eventPointer = where?.event;

  if (!eventPointer || !eventPointer.objectId) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Forbidden: event filter is required');
  }

  // Pobierz event i sprawdź ACL
  const event = await new Parse.Query('TestEvent').get(eventPointer.objectId, { useMasterKey: true });
  const acl = event.getACL();

  if (!acl || !acl.getReadAccess(user)) {
    throw new Parse.Error(403, 'Forbidden: you do not have access to this event');
  }
});
