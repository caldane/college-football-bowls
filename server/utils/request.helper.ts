import { IGuest } from "../../common/models/users/guest";
import { getCollection } from "./db";

interface MergeRequestBody {
    userId?: string;
    guest?: IGuest;
    otherUserIds?: string[];
}

export interface ValidMergeResult {
    user: IGuest;
    otherUsers: IGuest[];
    userId: string;
    guest: IGuest;
    otherUserIds: string[];
}

export class CodedError extends Error {
    status?: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function validateMergeBody(body: MergeRequestBody): Promise<ValidMergeResult> {
    const { userId, guest, otherUserIds } = body;

    if (!userId || !guest || !otherUserIds) {
        const keys = ["userId", "guest", "otherUserIds"] as (keyof MergeRequestBody)[];
        const fields = keys.filter((f) => !body[f]);
        throw new CodedError(400, `Missing required field(s): ${fields.join(", ")}`);
    }

    const [user] = await getCollection<IGuest>("users", { UserId: userId });
    const otherUsers = await getCollection<IGuest>("users", { UserId: { $in: otherUserIds } });

    if (!user) {
        throw new CodedError(404, `Invalid userId: ${userId}`);
    }

    console.log(`Merging guest accounts ${JSON.stringify(otherUsers)} into user ${userId}`);
    return { user, otherUsers, userId, guest, otherUserIds };
}
