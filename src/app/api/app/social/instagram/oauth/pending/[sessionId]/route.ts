import { forwardToBackend } from '../../../../../_utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  return forwardToBackend({
    path: `/api/v1/app/social/instagram/oauth/pending/${sessionId}`,
    method: 'GET',
    request,
  });
}
