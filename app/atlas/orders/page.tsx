import Link from "next/link";
import { assertAtlasPermission } from "@/lib/atlas-auth";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bestellingen | Atlas",
  robots: { index: false, follow: false },
};
export default async function Orders() {
  const { admin } = await assertAtlasPermission("orders", "/atlas/orders");
  const { data = [] } = await admin
    .from("ticket_orders")
    .select(
      "id,quantity,total,status,created_at,paid_at,ticket_events(title),ticket_types(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: resale = [] } = await admin
    .from("ticket_resale_orders")
    .select(
      "id,asking_price,buyer_fee,seller_fee,total,seller_payout,status,payout_status,created_at,paid_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
            Atlas beheer
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">Bestellingen</h1>
        </div>
        <Link href="/atlas" className="btn-secondary">
          Terug
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto rounded-[2rem] border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[.05] text-xs uppercase tracking-wider text-white/45">
            <tr>
              <th className="p-4">Bestelling</th>
              <th className="p-4">Evenement</th>
              <th className="p-4">Tickets</th>
              <th className="p-4">Totaal</th>
              <th className="p-4">Status</th>
              <th className="p-4">Datum</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((o: any) => (
              <tr key={o.id} className="border-t border-white/10">
                <td className="p-4 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="p-4">
                  <strong>{o.ticket_events?.title}</strong>
                  <br />
                  <span className="text-white/40">{o.ticket_types?.name}</span>
                </td>
                <td className="p-4">{o.quantity}</td>
                <td className="p-4 font-black">
                  € {Number(o.total).toFixed(2).replace(".", ",")}
                </td>
                <td className="p-4">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase">
                    {o.status}
                  </span>
                </td>
                <td className="p-4 text-white/45">
                  {new Date(o.created_at).toLocaleString("nl-NL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && (
          <div className="p-8 text-center text-white/45">
            Nog geen bestellingen.
          </div>
        )}
      </div>
      <h2 className="mt-12 text-2xl font-black">Doorverkoop</h2>
      <p className="mt-2 text-sm text-white/45">
        Uitbetaling blijft pending totdat ASORTA deze na het evenement
        vrijgeeft.
      </p>
      <div className="mt-5 overflow-x-auto rounded-[2rem] border border-white/10">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-white/[.05] text-xs uppercase tracking-wider text-white/45">
            <tr>
              <th className="p-4">Order</th>
              <th className="p-4">Vraagprijs</th>
              <th className="p-4">Koperskosten</th>
              <th className="p-4">Verkoperskosten</th>
              <th className="p-4">Uitbetaling</th>
              <th className="p-4">Orderstatus</th>
              <th className="p-4">Payout</th>
            </tr>
          </thead>
          <tbody>
            {(resale || []).map((o: any) => (
              <tr key={o.id} className="border-t border-white/10">
                <td className="p-4 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="p-4">
                  € {Number(o.asking_price).toFixed(2).replace(".", ",")}
                </td>
                <td className="p-4">
                  € {Number(o.buyer_fee).toFixed(2).replace(".", ",")}
                </td>
                <td className="p-4">
                  € {Number(o.seller_fee).toFixed(2).replace(".", ",")}
                </td>
                <td className="p-4 font-black text-[#b8ff5a]">
                  € {Number(o.seller_payout).toFixed(2).replace(".", ",")}
                </td>
                <td className="p-4 uppercase">{o.status}</td>
                <td className="p-4 uppercase">{o.payout_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!resale?.length && (
          <div className="p-8 text-center text-white/45">
            Nog geen doorverkooporders.
          </div>
        )}
      </div>
    </main>
  );
}
