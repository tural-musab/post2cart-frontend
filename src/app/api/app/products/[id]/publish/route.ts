import { forwardToBackend } from '../../../_utils';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardToBackend({
    path: `/api/v1/app/products/${id}/publish`,
    method: 'PATCH',
    request,
  });
}
