import { forwardToBackend } from '../_utils';

export async function GET(request: Request) {
  return forwardToBackend({
    path: '/api/v1/app/products',
    method: 'GET',
    request,
  });
}
