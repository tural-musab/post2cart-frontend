import { forwardToBackend } from '../_utils';

export async function POST(request: Request) {
  return forwardToBackend({
    path: '/api/v1/app/tenants',
    method: 'POST',
    request,
  });
}
