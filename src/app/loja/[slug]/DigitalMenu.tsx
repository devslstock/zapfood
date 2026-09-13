"use client";

import { useMemo, useRef, useState } from "react";
import { formatCents } from "@/lib/money";
import {
  DELIVERY_TYPES,
  DELIVERY_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type DeliveryType,
  type PaymentMethod,
} from "@/lib/domain";
import { lookupCep } from "@/lib/viacep";
import { resolveDeliveryFeeCents, parseNeighborhoodFromFormattedAddress } from "@/lib/deliveryZone";
import { ProductDetailSheet } from "./ProductDetailSheet";
import { AddressMap } from "./AddressMap";
import {
  buildLineId,
  cartLineTotalCents,
  type Category,
  type CartLine,
  type Product,
  type SelectedOption,
} from "./types";

type StoreOpenStatus = { isOpen: boolean; label: string } | null;
type SavedAddress = { id: string; address: string; addressLat: number | null; addressLng: number | null };
type AccountStep = "choice" | "login" | "create" | "guest";

function ProductCardButton({
  product,
  quantityInCart,
  onClick,
}: {
  product: Product;
  quantityInCart: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-zinc-100 transition hover:ring-brand"
    >
      <div className="relative aspect-square w-full bg-zinc-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🍽️</div>
        )}
        {quantityInCart > 0 && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {quantityInCart}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-zinc-900">{product.name}</p>
        <p className="mt-auto text-sm font-semibold text-brand-dark">
          {formatCents(product.priceCents)}
        </p>
      </div>
    </button>
  );
}

export function DigitalMenu({
  slug,
  storeName,
  logoUrl,
  coverImageUrl,
  whatsappContactPhone,
  deliveryFeeCents,
  deliveryZones,
  openStatus,
  categories,
}: {
  slug: string;
  storeName: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  whatsappContactPhone: string | null;
  deliveryFeeCents: number;
  deliveryZones: { neighborhood: string; feeCents: number }[];
  openStatus: StoreOpenStatus;
  categories: Category[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: number; totalCents: number } | null>(
    null
  );

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("ENTREGA");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("DINHEIRO");

  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "error">("idle");
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);

  // Conta do cliente (opcional): permite salvar nome/telefone/endereço com
  // um PIN de 4 dígitos pra não redigitar tudo no próximo pedido.
  const [accountStep, setAccountStep] = useState<AccountStep>("choice");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [createPin, setCreatePin] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [usingNewAddress, setUsingNewAddress] = useState(false);
  const [editingSelectedAddress, setEditingSelectedAddress] = useState(false);
  const [selectedAddressText, setSelectedAddressText] = useState("");

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  const cartQuantityByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((line) => {
      map[line.productId] = (map[line.productId] ?? 0) + line.quantity;
    });
    return map;
  }, [cart]);

  const totalItems = cart.reduce((sum, line) => sum + line.quantity, 0);
  const totalCents = cart.reduce((sum, line) => sum + cartLineTotalCents(line), 0);
  const selectedSavedAddress =
    !usingNewAddress && selectedAddressId
      ? savedAddresses.find((address) => address.id === selectedAddressId)
      : null;
  const effectiveNeighborhood = selectedSavedAddress
    ? parseNeighborhoodFromFormattedAddress(selectedSavedAddress.address) ?? ""
    : neighborhood;
  const deliveryFeeApplied =
    deliveryType === "ENTREGA"
      ? resolveDeliveryFeeCents(effectiveNeighborhood, deliveryZones, deliveryFeeCents)
      : 0;
  const grandTotalCents = totalCents + deliveryFeeApplied;

  function scrollToCategory(categoryId: string) {
    categoryRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addLine(input: { quantity: number; selectedOptions: SelectedOption[] }) {
    if (!selectedProduct) return;
    const lineId = buildLineId(selectedProduct.id, input.selectedOptions);
    setCart((prev) => {
      const existingIndex = prev.findIndex((line) => line.lineId === lineId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + input.quantity,
        };
        return next;
      }
      return [
        ...prev,
        {
          lineId,
          productId: selectedProduct.id,
          name: selectedProduct.name,
          unitPriceCents: selectedProduct.priceCents,
          quantity: input.quantity,
          selectedOptions: input.selectedOptions,
        },
      ];
    });
    setSelectedProduct(null);
  }

  function incrementLine(lineId: string) {
    setCart((prev) =>
      prev.map((line) => (line.lineId === lineId ? { ...line, quantity: line.quantity + 1 } : line))
    );
  }

  function decrementLine(lineId: string) {
    setCart((prev) =>
      prev
        .map((line) => (line.lineId === lineId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  const addressQueryForMap = useMemo(() => {
    if (!street.trim() || !number.trim() || !city.trim()) return "";
    return `${street}, ${number} - ${neighborhood}, ${city} - ${state}, ${cep}`;
  }, [street, number, neighborhood, city, state, cep]);

  // A localização só conta como confirmada se o pino foi confirmado para o
  // endereço ATUAL — evita usar coordenadas de um endereço antigo se o
  // cliente editar o texto depois de confirmar no mapa.
  const [confirmedQuery, setConfirmedQuery] = useState<string | null>(null);
  const isLocationConfirmed =
    Boolean(selectedSavedAddress) || (addressLat !== null && confirmedQuery === addressQueryForMap);

  async function handleAccountLogin() {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await fetch(`/api/loja/${slug}/customer-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone, pin: loginPin }),
      });
      const json = await response.json();
      if (!response.ok) {
        setLoginError(json.error ?? "Telefone ou senha incorretos.");
        return;
      }
      setCustomerName(json.name ?? "");
      setCustomerPhone(loginPhone);
      setSavedAddresses(json.addresses ?? []);
      setSelectedAddressId(json.addresses?.[0]?.id ?? null);
      setUsingNewAddress(!json.addresses?.length);
      setLoggedIn(true);
    } catch {
      setLoginError("Falha de conexão. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCepBlur() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepStatus("loading");
    const result = await lookupCep(cep);
    if (!result) {
      setCepStatus("error");
      return;
    }
    setStreet(result.logradouro || "");
    setNeighborhood(result.bairro || "");
    setCity(result.localidade || "");
    setState(result.uf || "");
    setCepStatus("idle");
  }

  const whatsappHref = useMemo(() => {
    if (!whatsappContactPhone || totalItems === 0) return null;
    const lines = [`Olá! Gostaria de fazer o seguinte pedido na ${storeName}:`, ""];
    cart.forEach((line) => {
      const optionsText = line.selectedOptions.length
        ? ` (${line.selectedOptions.map((o) => o.name).join(", ")})`
        : "";
      lines.push(
        `${line.quantity}x ${line.name}${optionsText} - ${formatCents(cartLineTotalCents(line))}`
      );
    });
    lines.push("", `Total: ${formatCents(totalCents)}`);
    const phone = whatsappContactPhone.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [cart, whatsappContactPhone, storeName, totalCents, totalItems]);

  const trackingWhatsappHref = useMemo(() => {
    if (!whatsappContactPhone || !confirmedOrder) return null;
    const text = `Olá! Quero acompanhar o meu pedido #${confirmedOrder.id} na ${storeName}.`;
    const phone = whatsappContactPhone.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [whatsappContactPhone, confirmedOrder, storeName]);

  function resetAccountState() {
    setAccountStep("choice");
    setLoginPhone("");
    setLoginPin("");
    setLoginError(null);
    setLoggedIn(false);
    setCreatePin("");
    setSavedAddresses([]);
    setSelectedAddressId(null);
    setUsingNewAddress(false);
    setEditingSelectedAddress(false);
    setSelectedAddressText("");
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setFormError(null);
  }

  function startNewOrder() {
    setCart([]);
    setConfirmedOrder(null);
    setCheckoutOpen(false);
    setCustomerName("");
    setCustomerPhone("");
    setCep("");
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setCity("");
    setState("");
    setAddressLat(null);
    setAddressLng(null);
    setConfirmedQuery(null);
    resetAccountState();
  }

  async function handleCheckoutSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    let fullAddress: string | undefined;
    let finalAddressLat: number | undefined;
    let finalAddressLng: number | undefined;

    if (deliveryType === "ENTREGA") {
      if (selectedSavedAddress && !editingSelectedAddress) {
        fullAddress = selectedSavedAddress.address;
        finalAddressLat = selectedSavedAddress.addressLat ?? undefined;
        finalAddressLng = selectedSavedAddress.addressLng ?? undefined;
      } else if (selectedSavedAddress && editingSelectedAddress) {
        if (!selectedAddressText.trim()) {
          setFormError("O endereço não pode ficar em branco.");
          return;
        }
        fullAddress = selectedAddressText.trim();
        finalAddressLat = selectedSavedAddress.addressLat ?? undefined;
        finalAddressLng = selectedSavedAddress.addressLng ?? undefined;
      } else {
        if (!street.trim() || !number.trim() || !city.trim() || !state.trim()) {
          setFormError("Preencha rua, número, cidade e estado.");
          return;
        }
        if (!isLocationConfirmed) {
          setFormError("Confirme a localização no mapa antes de finalizar.");
          return;
        }
        fullAddress = `${street}, ${number}${complement ? ` - ${complement}` : ""} - ${neighborhood}, ${city}/${state} - CEP ${cep}`;
        finalAddressLat = addressLat ?? undefined;
        finalAddressLng = addressLng ?? undefined;
      }
    }

    if (accountStep === "create" && !/^\d{4}$/.test(createPin)) {
      setFormError("Crie uma senha de 4 dígitos.");
      return;
    }

    const reusingUnEditedSavedAddress = Boolean(selectedSavedAddress) && !editingSelectedAddress;
    const addressIdToUpdate =
      selectedSavedAddress && editingSelectedAddress ? selectedSavedAddress.id : undefined;
    const shouldSaveNewAddress =
      deliveryType === "ENTREGA" &&
      !reusingUnEditedSavedAddress &&
      !addressIdToUpdate &&
      (accountStep === "create" || (loggedIn && usingNewAddress));

    setSubmitting(true);
    try {
      const response = await fetch(`/api/loja/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deliveryType,
          address: fullAddress,
          addressLat: deliveryType === "ENTREGA" ? finalAddressLat : undefined,
          addressLng: deliveryType === "ENTREGA" ? finalAddressLng : undefined,
          neighborhood: deliveryType === "ENTREGA" ? effectiveNeighborhood : undefined,
          pin: accountStep === "create" ? createPin : undefined,
          addressId: addressIdToUpdate,
          saveAddress: shouldSaveNewAddress,
          paymentMethod,
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            selectedOptionIds: line.selectedOptions.map((o) => o.optionId),
          })),
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        setFormError(json.error ?? "Não foi possível confirmar o pedido.");
        return;
      }

      setConfirmedOrder({ id: json.orderId, totalCents: json.totalCents });
    } catch {
      setFormError("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      <div className="h-40 w-full overflow-hidden sm:h-56">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand to-brand-dark" />
        )}
      </div>

      <div className="mx-auto max-w-2xl px-6">
        <div className="relative -mt-8 rounded-2xl bg-white px-4 pb-4 pt-10 shadow-sm ring-1 ring-zinc-100">
          <div className="absolute -top-8 left-4 h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-brand text-xl font-bold text-white">
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-zinc-900">{storeName}</h1>
          {openStatus && (
            <p
              className={`text-sm font-medium ${
                openStatus.isOpen ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {openStatus.label}
            </p>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="sticky top-0 z-10 mt-4 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-6 py-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToCategory(category.id)}
                className="shrink-0 rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-6 py-6">
        {categories.length === 0 && (
          <p className="text-center text-sm text-zinc-500">Cardápio ainda não disponível.</p>
        )}
        {categories.map((category) => (
          <section
            key={category.id}
            ref={(el) => {
              categoryRefs.current[category.id] = el;
            }}
            className="mb-8 scroll-mt-16"
          >
            <h2 className="text-lg font-semibold text-zinc-900">{category.name}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {category.products.map((product) => (
                <ProductCardButton
                  key={product.id}
                  product={product}
                  quantityInCart={cartQuantityByProduct[product.id] ?? 0}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white p-4 shadow-lg">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">{totalItems} item(ns)</p>
              <p className="font-bold text-zinc-900">{formatCents(totalCents)}</p>
            </div>
            <div className="flex items-center gap-3">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-dark underline-offset-2 hover:underline"
                >
                  ou pelo WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
              >
                Finalizar pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={addLine}
        />
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-md sm:rounded-2xl">
            {confirmedOrder ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl">
                  🎉
                </div>
                <h3 className="text-lg font-bold text-zinc-900">
                  Pedido #{confirmedOrder.id} confirmado!
                </h3>
                <p className="text-sm text-zinc-600">
                  Total: {formatCents(confirmedOrder.totalCents)}. Enviamos a confirmação para o
                  seu WhatsApp.
                </p>
                <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                  {trackingWhatsappHref && (
                    <a
                      href={trackingWhatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-emerald-600 px-6 py-3 text-center font-semibold text-white hover:bg-emerald-700"
                    >
                      Acompanhar no WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={startNewOrder}
                    className="rounded-full border border-zinc-300 px-6 py-3 font-semibold text-zinc-700 hover:bg-zinc-100"
                  >
                    Fazer novo pedido
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900">Finalizar pedido</h3>
                  <button
                    type="button"
                    onClick={closeCheckout}
                    aria-label="Fechar"
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="rounded-xl bg-zinc-50 p-3 text-sm">
                  {cart.map((line) => (
                    <div key={line.lineId} className="flex items-center justify-between gap-2 py-1">
                      <div>
                        <p className="text-zinc-700">
                          {line.quantity}x {line.name}
                        </p>
                        {line.selectedOptions.length > 0 && (
                          <p className="text-xs text-zinc-400">
                            {line.selectedOptions.map((o) => o.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decrementLine(line.lineId)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-xs text-zinc-600"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-xs">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => incrementLine(line.lineId)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-white"
                        >
                          +
                        </button>
                        <span className="w-16 text-right font-medium text-zinc-900">
                          {formatCents(cartLineTotalCents(line))}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-zinc-600">
                    <span>Subtotal</span>
                    <span>{formatCents(totalCents)}</span>
                  </div>
                  {deliveryType === "ENTREGA" && (
                    <div className="flex justify-between text-zinc-600">
                      <span>Taxa de entrega</span>
                      <span>{deliveryFeeApplied > 0 ? formatCents(deliveryFeeApplied) : "Grátis"}</span>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between font-semibold text-zinc-900">
                    <span>Total</span>
                    <span>{formatCents(grandTotalCents)}</span>
                  </div>
                </div>

                {accountStep === "choice" && (
                  <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3">
                    <p className="text-sm font-medium text-zinc-700">
                      Já pediu aqui antes?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountStep("login")}
                        className="flex-1 rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand-dark hover:bg-brand/5"
                      >
                        Já tenho conta
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountStep("create")}
                        className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                      >
                        Criar conta
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccountStep("guest")}
                      className="text-xs font-medium text-zinc-400 hover:text-zinc-600 hover:underline"
                    >
                      Continuar sem conta
                    </button>
                  </div>
                )}

                {accountStep === "login" && !loggedIn && (
                  <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-700">Entrar na minha conta</p>
                      <button
                        type="button"
                        onClick={() => setAccountStep("choice")}
                        className="text-xs text-zinc-400 hover:underline"
                      >
                        voltar
                      </button>
                    </div>
                    <input
                      type="tel"
                      placeholder="Seu WhatsApp (11999999999)"
                      value={loginPhone}
                      onChange={(event) => setLoginPhone(event.target.value)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Senha (4 dígitos)"
                      value={loginPin}
                      onChange={(event) => setLoginPin(event.target.value.replace(/\D/g, ""))}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    {loginError && <p className="text-xs text-red-600">{loginError}</p>}
                    <button
                      type="button"
                      disabled={loginLoading || loginPhone.length < 8 || loginPin.length !== 4}
                      onClick={handleAccountLogin}
                      className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                    >
                      {loginLoading ? "Buscando..." : "Buscar"}
                    </button>
                  </div>
                )}

                {(accountStep === "guest" || accountStep === "create" || (accountStep === "login" && loggedIn)) && (
                  <>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Seu nome</label>
                  <input
                    required
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700">Seu WhatsApp</label>
                  <input
                    required
                    type="tel"
                    placeholder="11999999999"
                    readOnly={accountStep === "login"}
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    className={`mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${
                      accountStep === "login" ? "bg-zinc-100 text-zinc-500" : ""
                    }`}
                  />
                </div>

                {accountStep === "create" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700">
                      Crie uma senha de 4 dígitos
                    </label>
                    <input
                      required
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={createPin}
                      onChange={(event) => setCreatePin(event.target.value.replace(/\D/g, ""))}
                      placeholder="0000"
                      className="mt-1 w-full max-w-[120px] rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <p className="mt-1 text-xs text-zinc-400">
                      Usada pra puxar seus dados no próximo pedido, sem precisar redigitar tudo.
                    </p>
                  </div>
                )}

                <div>
                  <span className="block text-sm font-medium text-zinc-700">Entrega</span>
                  <div className="mt-1 flex gap-2">
                    {DELIVERY_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDeliveryType(type)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                          deliveryType === type
                            ? "border-brand bg-brand/10 text-brand-dark"
                            : "border-zinc-300 text-zinc-600"
                        }`}
                      >
                        {DELIVERY_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {deliveryType === "ENTREGA" && accountStep === "login" && savedAddresses.length > 0 && !usingNewAddress && (
                  <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3">
                    <p className="text-sm font-medium text-zinc-700">Endereço salvo</p>
                    {savedAddresses.map((address) => (
                      <label
                        key={address.id}
                        className="flex items-start gap-2 rounded-lg border border-zinc-200 p-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand/5"
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === address.id}
                          onChange={() => {
                            setSelectedAddressId(address.id);
                            setEditingSelectedAddress(false);
                          }}
                          className="mt-1"
                        />
                        <span className="text-zinc-700">{address.address}</span>
                      </label>
                    ))}
                    {selectedSavedAddress && !editingSelectedAddress && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSelectedAddress(true);
                          setSelectedAddressText(selectedSavedAddress.address);
                        }}
                        className="self-start text-xs font-medium text-brand-dark hover:underline"
                      >
                        Editar este endereço
                      </button>
                    )}
                    {selectedSavedAddress && editingSelectedAddress && (
                      <textarea
                        value={selectedAddressText}
                        onChange={(event) => setSelectedAddressText(event.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setUsingNewAddress(true)}
                      className="self-start text-xs font-medium text-zinc-500 hover:underline"
                    >
                      Usar outro endereço
                    </button>
                  </div>
                )}

                {deliveryType === "ENTREGA" && (accountStep !== "login" || usingNewAddress || savedAddresses.length === 0) && (
                  <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-3">
                    {accountStep === "login" && savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUsingNewAddress(false)}
                        className="self-start text-xs font-medium text-zinc-500 hover:underline"
                      >
                        ← usar endereço salvo
                      </button>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700">CEP</label>
                      <input
                        required
                        value={cep}
                        onChange={(event) => setCep(event.target.value)}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="mt-1 w-full max-w-[160px] rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                      {cepStatus === "loading" && (
                        <p className="mt-1 text-xs text-zinc-500">Buscando endereço...</p>
                      )}
                      {cepStatus === "error" && (
                        <p className="mt-1 text-xs text-amber-600">
                          CEP não encontrado — preencha o endereço manualmente.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        required
                        placeholder="Rua"
                        value={street}
                        onChange={(event) => setStreet(event.target.value)}
                        className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                      <input
                        required
                        placeholder="Número"
                        value={number}
                        onChange={(event) => setNumber(event.target.value)}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <input
                      placeholder="Complemento (opcional)"
                      value={complement}
                      onChange={(event) => setComplement(event.target.value)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        placeholder="Bairro"
                        value={neighborhood}
                        onChange={(event) => setNeighborhood(event.target.value)}
                        className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                      <input
                        required
                        placeholder="UF"
                        maxLength={2}
                        value={state}
                        onChange={(event) => setState(event.target.value.toUpperCase())}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm uppercase focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <input
                      required
                      placeholder="Cidade"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />

                    {addressQueryForMap && (
                      <AddressMap
                        query={addressQueryForMap}
                        lat={addressLat}
                        lng={addressLng}
                        onConfirm={(lat, lng) => {
                          setAddressLat(lat);
                          setAddressLng(lng);
                          setConfirmedQuery(addressQueryForMap);
                        }}
                        onDirty={() => setConfirmedQuery(null)}
                      />
                    )}
                  </div>
                )}

                <div>
                  <span className="block text-sm font-medium text-zinc-700">Pagamento</span>
                  <div className="mt-1 flex gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                          paymentMethod === method
                            ? "border-brand bg-brand/10 text-brand-dark"
                            : "border-zinc-300 text-zinc-600"
                        }`}
                      >
                        {PAYMENT_METHOD_LABELS[method]}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {submitting ? "Enviando..." : `Confirmar pedido — ${formatCents(grandTotalCents)}`}
                </button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
