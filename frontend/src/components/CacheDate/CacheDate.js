import React from "react";

const CacheDate = ({ cacheDate }) => {
    return (
        <p>
            Cache Date:{" "}
            {cacheDate
                ? new Date(cacheDate).toLocaleString("en-US", {
                      timeZone: "America/Chicago", // Forces Central Time
                      weekday: "short", // e.g., "Sat"
                      month: "short", // e.g., "Dec"
                      day: "numeric", // e.g., "13"
                      year: "numeric", // e.g., "2025"
                      hour: "numeric", // e.g., "6:00 PM"
                      minute: "2-digit", // e.g., "30"
                      timeZoneName: "short", // e.g., "CST" or "CDT"
                  })
                : "Loading..."}
        </p>
    );
};

export default CacheDate;
