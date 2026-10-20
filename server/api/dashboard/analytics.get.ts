import { withAuth } from '~~/server/utils/withAuth';
import { sendSuccess } from '~~/server/utils/response';
import * as analyticsService from '~~/server/services/analytics.service';

export default withAuth(async (event) => {
  const query = getQuery(event);
  const range = (query.range as string) || '30days';

  const data = await analyticsService.getDashboardAnalytics(range);

  return sendSuccess(
    event,
    data,
    'Dashboard analytics retrieved successfully',
    'analytics_retrieved'
  );
});
