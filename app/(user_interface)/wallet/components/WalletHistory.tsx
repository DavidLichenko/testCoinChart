"use client";

import {useWallet} from "../hooks/useWallet";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useI18n} from "@/components/i18n-provider";

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    COMPLETED: "bg-green-500/15 text-green-300 border-green-500/30",
    FAILED: "bg-red-500/15 text-red-300 border-red-500/30"
};

export function WalletHistory() {
    const { transactions, isLoading } = useWallet();
    const { t } = useI18n("wallet.history")

    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
                {t("title") /* en: "Transaction history", es: "Historial de transacciones" */}
            </h2>

            <div className="bg-[#11111f] rounded-2xl border border-white/5 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/5">
                            <TableHead className="text-xs text-white/60">
                                {t("date") /* en: "Date", es: "Fecha" */}
                            </TableHead>
                            <TableHead className="text-xs text-white/60">
                                {t("type") /* en: "Type", es: "Tipo" */}
                            </TableHead>
                            <TableHead className="text-xs text-white/60">
                                {t("asset") /* en: "Asset", es: "Activo" */}
                            </TableHead>
                            <TableHead className="text-xs text-white/60">
                                {t("amount") /* en: "Amount", es: "Cantidad" */}
                            </TableHead>
                            <TableHead className="text-xs text-white/60">
                                {t("status") /* en: "Status", es: "Estado" */}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-6 text-center text-white/40"
                                >
                                    {/* en: "Loading...", es: "Cargando..." */}
                                    {t("loading")}
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && transactions && transactions.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-6 text-center text-white/40"
                                >
                                    {t("empty") /* en: "No transactions yet", es: "Aún no hay transacciones" */}
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading &&
                            transactions &&
                            transactions.map((tx) => (
                                <TableRow key={tx.id} className="border-white/5">
                                    <TableCell className="text-xs text-white/60">
                                        {new Intl.DateTimeFormat("en-GB", {
                                            dateStyle: "short",
                                            timeStyle: "short"
                                        }).format(new Date(tx.createdAt))}
                                    </TableCell>
                                    <TableCell className="text-xs text-white">
                                        {tx.type}
                                    </TableCell>
                                    <TableCell className="text-xs text-white/80">
                                        {tx.assetSymbol}
                                    </TableCell>
                                    <TableCell className="text-xs text-white">
                                        {tx.amount}
                                    </TableCell>
                                    <TableCell className="text-xs">
                    <span
                        className={`inline-flex px-2 py-1 rounded-full border text-[10px] uppercase tracking-wide ${
                            statusColors[tx.status] ?? "bg-white/10 text-white/70"
                        }`}
                    >
                      {tx.status}
                    </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    );
}
