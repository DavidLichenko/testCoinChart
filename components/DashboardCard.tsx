export default function DashboardCard({ title, value, change }) {
    let changeColor = 'text-gray-500'; // Default color for no change (0%)

    if (change > 0) {
        changeColor = 'text-green-500'; // Positive change (green)
    } else if (change < 0) {
        changeColor = 'text-red-500'; // Negative change (red)
    }
    console.log(change)
    return (
        <div className="rounded-lg shadow-lg p-6 bg-border border-border border-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-3xl font-bold  mt-2">{value}</p>
            {change !== null && (
                <p className={`text-sm ${changeColor}`}>
                    {change !== 0 ? (change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`) : 'No Change'}
                </p>
            )}
        </div>
    );
}
