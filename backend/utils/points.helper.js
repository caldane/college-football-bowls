export const calculateGamePoints = (bowl, homeRank, awayRank) => {
    if (bowl.notes === "College Football Playoff National Championship") {
        return 30; // CFP game base points
    }
    if (bowl.notes.includes("College Football Playoff Semifinal")) {
        return 16;
    }
    if (bowl.notes.includes("College Football Playoff Quarterfinal")) {
        return 10;
    }
    if (bowl.notes.includes("College Football Playoff First Round Game")) {
        return 6;
    }
    if (homeRank && awayRank) {
        return 5;
    }
    if (homeRank || awayRank) {
        return 4;
    }
    if (bowl.homeConference === "SEC" || bowl.awayConference === "SEC") {
        return 3; // SEC bonus point
    }
    if (bowl.homeConference === "Big Ten" || bowl.awayConference === "Big Ten") {
        return 2; // Big Ten bonus point
    }
    if (bowl.homeConference === "ACC" || bowl.awayConference === "ACC") {
        return 2;
    }
    if (bowl.homeConference === "Big 12" || bowl.awayConference === "Big 12") {
        return 2;
    }

    return 1; // Default point value for other bowls
};

export const calculatePickPoints = (userPick, bowl) => {
    const pointValue = calculateGamePoints(bowl);
    const winnerId = bowl.awayPoints === null && bowl.homePoints === null ? null : bowl.awayPoints > bowl.homePoints ? bowl.awayId : bowl.homeId;

    if (userPick?.double) {
        if (winnerId && userPick?.teamId === winnerId) {
            return pointValue * 2;
        } else if (winnerId) {
            return pointValue * -1;
        }
    }
    if (winnerId && userPick?.teamId === winnerId) {
        return pointValue;
    }

    return 0;
};

export const calculateUserPoints = (bowls) => {
    return Object.entries(bowls.reduce((users, bowl) => {
        bowl.picks.reduce((users, pick) => {
            if (!users[pick.user]) {
                users[pick.user] = 0;
            }
            if (!pick.points) {
                return users;
            }
            users[pick.user] += pick.points;
            return users;
        }, users);

        return users;
    }, {}))
    .map(([user, points]) => ({ user, points }))
    .sort((a, b) => b.points - a.points);
};
