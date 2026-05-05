import Parse from "parse";
 
Parse.initialize(
  process.env.PARSE_APP_ID!,
  process.env.PARSE_JS_KEY!
);
Parse.serverURL = process.env.PARSE_SERVER_URL!;
 
export default Parse;
