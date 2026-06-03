Parse.Cloud.beforeFind('Event', async (request) => {
  const user = request.user;

  // Brak sesji — blokuj
  if (!user) {
    throw new Parse.Error(Parse.Error.SESSION_MISSING, 'Unauthorized');
  }

  // Admin widzi wszystko — nie modyfikuj query
  if (user.get('role') === 'Admin') {
    return;
  }

  // Organizer — wymuś filtr po organizerze niezależnie od tego co przyszło z frontendu
  request.query.equalTo('organizer', user);
});

Parse.Cloud.beforeGet('Event', async (request) => {
  const user = request.user;

  if (!user) {
    throw new Parse.Error(Parse.Error.SESSION_MISSING, 'Unauthorized');
  }

  if (user.get('role') === 'Admin') {
    return;
  }

  // Pobierz event i sprawdź czy organizer zgadza się z zalogowanym userem
  const event = await new Parse.Query('Event').get(request.params.objectId, { useMasterKey: true });
  const organizer = event.get('organizer');

  if (!organizer || organizer.id !== user.id) {
    throw new Parse.Error(403, 'Forbidden: this event does not belong to you');
  }
});