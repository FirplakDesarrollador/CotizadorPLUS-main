import { NextRequest, NextResponse } from 'next/server';
// redirect() usa 307; este handler conserva el 301 solicitado y los filtros compartidos.
export function GET(request:NextRequest) {
 const url=request.nextUrl.clone();url.pathname='/cotizaciones';url.searchParams.set('vista','dashboard');return NextResponse.redirect(url,301);
}
