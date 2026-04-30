import Parse from "parse";
import {Event} from "./Event";

export type RegistrationStatus = "pending" | "approved";

export class Registration extends Parse.Object {
    constructor() {
        super("Registration");
    }

    get event(): Event{
        return this.get("event");
    }
    set event(value: Event){
        this.set("event", value);
    }

    get formData(): Record<string, unknown> {
        return this.get("formData");
    }
    set formData(value: Record<string, unknown>) {
        this.set("formData", value);
    }

    get status(): RegistrationStatus {
        return this.get("status");
    }
    set status(value: RegistrationStatus) {
        this.set("status", value);
    }

    get checkInTime(): Date | null {
        return this.get("checkInTime") ?? null;
    }
    set checkInTime(value: Date | null) {
        this.set("checkInTime", value as any);
    }
}

Parse.Object.registerSubclass("Registration", Registration);