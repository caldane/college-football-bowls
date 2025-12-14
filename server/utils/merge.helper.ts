import { getCollectionGroup, getCollection, updateEntity } from "./db";

export const updateArchiveRegistration = async (userId: string, otherUserIds: string[]): Promise<void> => {
            // Get registrations for deleted users
            const registrationCollections = await getCollectionGroup("registrations");
    
            await Promise.all(
                registrationCollections.map(async (collectionName) => {
                    const updatesForCollection = [];
    
                    for (const otherUserId of otherUserIds) {
                        const registrations = await getCollection(collectionName, { guestId: otherUserId });
    
                        updatesForCollection.push(
                            ...registrations.map((registration) => {
                                console.log(
                                    `Updating registration ${registration._id} in ${collectionName} to userId ${userId}`
                                );
                                return updateEntity(collectionName, registration._id.toString(), {
                                    guestId: userId
                                });
                            })
                        );
                    }
    
                    return Promise.all(updatesForCollection);
                })
            );
        }