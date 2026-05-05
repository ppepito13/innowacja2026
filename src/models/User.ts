import Parse from "parse";

export type UserRole = "Admin" | "Organizer";

export interface IAppUser {
  role: UserRole;
}

export class AppUser extends Parse.User<IAppUser> {
  constructor() {
    super();
  }

  get role(): UserRole {
    return this.get("role");
  }
  set role(value: UserRole) {
    this.set("role", value);
  }
}

Parse.Object.registerSubclass("_User", AppUser);