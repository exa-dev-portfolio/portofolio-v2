import {unbindAppleFromUser} from "~~/server/services/settings.service";
import {withAuth} from "~~/server/utils/withAuth";

export default withAuth(async (event) => {
    return await unbindAppleFromUser(event);
});
