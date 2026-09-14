-- Habilita Row Level Security em todas as tabelas do schema public.
--
-- O app nunca usa a API REST/GraphQL do Supabase (PostgREST) — ele fala
-- direto com o Postgres via Prisma, usando o usuário "postgres" (superusuário,
-- que sempre ignora RLS). Sem RLS habilitado, porém, o Supabase expõe todas
-- essas tabelas publicamente pela API dele para qualquer pessoa com a URL do
-- projeto. Habilitar RLS sem nenhuma policy bloqueia esse acesso público por
-- padrão, sem afetar em nada as queries do app.
ALTER TABLE "public"."Store" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PlatformAdmin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PlatformSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PlatformSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductOptionGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CustomerAddress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DeliveryZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ConversationState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MenuView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderStatusEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
