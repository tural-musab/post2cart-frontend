import { forwardToBackend } from '../../../../_utils';

export async function GET(request: Request) {
  return forwardToBackend({
    path: '/api/v1/app/social/instagram/oauth/start',
    method: 'GET',
    request,
  });
}
