import { Registration } from "../../common/models/registration.model";

const pseudonymMap = new Map<string, string>();
// pseudonymMap.set( "Aidyn Cross", "Showrunner for Red Dirt DnD" );

const gohRegistrationMap = new Map<string, Registration>();
//  gohRegistrationMap.set( "Dawn Frost Cosplay", {guestId:"dawnFrost2024"} as Registration);

const slugMap = new Map<string, string>();
slugMap.set("Dawn Frost Cosplay", "dawn-frost");
slugMap.set("Casey Alden aka eBay Miniature Rescues", "casey-alden");
slugMap.set("John Eads/Jim Shorts", "john-eads");
slugMap.set("Charlie N. Holmberg", "charlie-holmberg");

const Maps = { pseudonymMap, gohRegistrationMap, slugMap };

export default Maps;
