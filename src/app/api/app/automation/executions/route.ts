import { forwardToBackend } from '../../_utils';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const path = query
    ? `/api/v1/app/automation/executions?${query}`
    : '/api/v1/app/automation/executions';

  return forwardToBackend({
    path,
    method: 'GET',
    request,
  });
}
