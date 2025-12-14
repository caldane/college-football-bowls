import { Router } from "express";
import { IGuest } from "../../common/models/users/guest";
import { deleteEntity, getCollection, getCollectionGroup, updateEntity } from "../utils/db";
import { CodedError, validateMergeBody } from "../utils/request.helper";
import { updateArchiveRegistration } from "../utils/merge.helper";

const guestRouter = Router();

guestRouter.patch("/merge", async (req, res) => {
    try {
        const { user, otherUsers, userId, guest, otherUserIds } = await validateMergeBody(req.body);

        // Update main user
        await updateEntity("users", user._id.toString(), guest);

        // Delete merged users
        await Promise.all(
            otherUsers.map((deleteUser) => {
                console.log(`Deleting guest account ${deleteUser._id} from users collection`);
                return deleteEntity("users", deleteUser._id.toString());
            })
        );

        await updateArchiveRegistration(userId, otherUserIds);
        
        const updatedUser = await getCollection<IGuest>("users", { UserId: userId });
        console.log(updatedUser)
        return res.status(206).send(updatedUser);
    } catch (err: CodedError | any) {
        if (err.status) {
            return res.status(err.status).send(err.message);
        }

        console.error("Error merging users:", err);
        return res.status(500).send("Internal Server Error");
    }
});


export default guestRouter;
