import Parse from "parse";

export type UserRole = "Admin" | "Organizer";

export class User extends Parse.User {
    constructor() {
        super();
    }

    get role(): UserRole{
        return this.get("role");
    }
    set role(value: UserRole) {
        this.set("role", value);
    }
}

Parse.Object.registerSubclass("_User", User);