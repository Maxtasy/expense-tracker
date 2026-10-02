import { CoinLoader } from "@/components/coin-loader";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16">
      <CoinLoader size={48} />
    </div>
  );
}
