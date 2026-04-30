import Parse from "parse";

export class Event extends Parse.Object {
    constructor() {
        super("Event");
    }

    get title(): string {
        return this.get("title");
    }
    set title(value: string) {
        this.set("title", value);
    }

    get description(): string {
        return this.get("description");
    }
    set description(value: string) {
        this.set("description", value);
    }

    get startDate(): Date {
        return this.get("startDate");
    }
    set startDate(value: Date) {
        this.set("startDate", value);
    }

    get isActive(): boolean {
        return this.get("isActive");
    }
    set isActive(value: boolean) {
        this.set("isActive", value);
    }

    get formConfig(): Record<string, unknown> {
        return this.get("formConfig");
    }
    set formConfig(value: Record<string, unknown>) {
        this.set("formConfig", value);
    }

}
Parse.Object.registerSubclass("Event", Event);