/* Type definitions based on documentation at https://docs.clockify.me/*/

/** A TimeEntry for a Clockify User*/
export type TimeEntry = {
    /** Indicates whether a time entry is billable. */
    billable: boolean

    /** Represents a cost rate object. */
    costRate: RateDtoV1

    /** Represents a list of custom field value objects. */ 
    customFieldValues: CustomFieldValueDtoV1[]

    /** Represents time entry description. */
    description: string

    /** Represents a cost rate object. */
    hourlyRate: RateDtoV1

    /** Represents time entry identifier across the system. */
    id: string

    /** Represents whether time entry is locked for modification. */
    isLocked: boolean

    /** Represents kiosk identifier across the system. */
    kioskID: string

    /** Represents project identifier across the system. */
    projectID: string

    /** Represents a list of tag identifiers across the system. */
    tagIds: string[]

    /** Represents task identifier across the system. */
    taskID: string

    /** Represents a time interval object. */
    timeInterval: TimeIntervalDtoV1

    /** Represents a time entry type enum. */
    type: "REGULAR" | "BREAK" | "HOLIDAY" | "TIME_OFF"

    /** Represents user identifier across the system. */
    userID: string

    /** Represents workspace identifier across the system. */
    workspaceID: string
}

/** Represents a cost rate object. */
type RateDtoV1 = {
    /** Represents an amount as an integer. */
    amount: number

    /** Represents a currency. */
    currency: string
}

/** Represents a custom field value object. */
type CustomFieldValueDtoV1 = {
    /** Represents custom field identifier across the system. */
    customFieldID: string

    /** Represents custom field name. */
    name: string

    /** Represents time entry identifier across the system. */
    timeEntryID: string

    /** Represents a custom field value source type. */
    type: string

    /** Represents custom field value. */
    value: string
}

/** Represents a time interval object. */
type TimeIntervalDtoV1 = {
    /** Represents a time duration. */
    duration: string

    /** Represents an end date in yyyy-MM-ddThh:mm:ssZ format. */
    end: string

    /** Represents a start date in yyyy-MM-ddThh:mm:ssZ format. */
    start: string
}