import React from "react";

const UserList = ({ users }) => {
    if (!users || users.length === 0) {
        return <p>No user data available.</p>;
    }
    
    return (
        <ul>
            {users
                .sort((a, b) => b.points - a.points)
                .map((user, idx) => (
                    <li key={idx}>
                        {user.user}: {user.points} points
                    </li>
                ))}
        </ul>
    );
};

export default UserList;
