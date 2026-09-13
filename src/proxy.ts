import { NextRequest, NextResponse } from "next/server";

// Sem ROOT_DOMAIN configurado (ainda sem domínio próprio), o proxy não faz
// nada — o cardápio continua acessível só por /loja/[slug], como hoje.
const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

// Caminhos que nunca pertencem a uma loja: continuam resolvendo normalmente
// em qualquer host. Admin/super-admin não dependem de subdomínio — a sessão é
// um cookie do domínio raiz, não amarrada ao slug da loja.
const RESERVED_PREFIXES = ["/api", "/admin", "/super-admin", "/cadastro", "/loja", "/_next"];

export function proxy(request: NextRequest) {
  if (!ROOT_DOMAIN) return NextResponse.next();

  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const rootHostname = ROOT_DOMAIN.split(":")[0];

  const isRootHost = hostname === rootHostname || hostname === `www.${rootHostname}`;
  if (isRootHost || !hostname.endsWith(`.${rootHostname}`)) {
    return NextResponse.next();
  }

  const subdomain = hostname.slice(0, -(`.${rootHostname}`.length));
  // "www" já tratado acima; subdomínio com ponto seria um sub-subdomínio, não um slug de loja.
  if (!subdomain || subdomain.includes(".")) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (RESERVED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/loja/${subdomain}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
