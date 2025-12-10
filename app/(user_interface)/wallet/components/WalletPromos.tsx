"use client";

import {useI18n} from "@/components/i18n-provider";

export function WalletPromos() {
    const { t } = useI18n("wallet.promos");

    return (
        <section className="space-y-3">
            <div className="grid gap-3">
                <div className="bg-gradient-to-br from-[#7a3cff] via-[#a94dff] to-[#2BFFDA] rounded-2xl p-[1px]">
                    <div className="bg-[#0b0b16] rounded-2xl p-4 flex flex-col gap-2">
                        <p className="text-[11px] uppercase tracking-wide text-white/70">
                            {t("stakingBadge") /* en: "Staking", es: "Staking" */}
                        </p>
                        <p className="text-sm font-semibold text-white">
                            {t("stakingTitle") /* en: "Earn up to 12% APR on your crypto", es: "Gana hasta 12% APR con tu cripto" */}
                        </p>
                        <p className="text-xs text-white/70">
                            {t("stakingText") /* en: "Lock assets in flexible plans and receive rewards automatically.", es: "Bloquea activos en planes flexibles y recibe recompensas automáticamente." */}
                        </p>
                    </div>
                </div>

                <div className="bg-[#11111f] rounded-2xl p-4 border border-[#ffaa3c]/40 flex flex-col gap-2">
                    <p className="text-[11px] uppercase tracking-wide text-[#ffd28a]">
                        {t("referralBadge") /* en: "Referral program", es: "Programa de referidos" */}
                    </p>
                    <p className="text-sm font-semibold text-white">
                        {t("referralTitle") /* en: "Invite friends and get bonuses", es: "Invita amigos y gana bonos" */}
                    </p>
                    <p className="text-xs text-white/70">
                        {t("referralText") /* en: "Share your link and receive rewards from their activity.", es: "Comparte tu enlace y recibe recompensas de su actividad." */}
                    </p>
                </div>
            </div>
        </section>
    );
}
