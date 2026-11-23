import { NextResponse } from 'next/server';

export function proxy() {
  // Akses demo langsung ke seluruh dashboard & kasir POS tanpa blokir
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

