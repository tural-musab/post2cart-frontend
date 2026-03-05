import { forwardToBackend } from '../../../../_utils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardToBackend({
    path: `/api/v1/app/automation/failed-items/${id}/retry`,
    method: 'POST',
    request,
  });
}
