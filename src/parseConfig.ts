import Parse from 'parse';

Parse.initialize(
    process.env.REACT_APP_PARSE_APP_ID!,
    ''
);
Parse.serverURL = '/parse';

export default Parse;