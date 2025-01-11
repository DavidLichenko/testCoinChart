// 'use client'
//
// import { ArrowDown, ArrowUp } from 'lucide-react'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table'
// // import { MarketData } from '@/types/market'
//
// interface MarketTableProps {
//   data: Record<string, MarketData>
// }
//
// export function MarketTable({ data }: MarketTableProps) {
//   const sortedData = Object.values(data).sort((a, b) => b.volume - a.volume)
//
//   return (
//     <div className="rounded-md border">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Symbol</TableHead>
//             <TableHead className="text-right">Price</TableHead>
//             <TableHead className="text-right">Change</TableHead>
//             <TableHead className="text-right">Volume</TableHead>
//             <TableHead className="text-right">High</TableHead>
//             <TableHead className="text-right">Low</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {sortedData.map((market) => (
//             <TableRow key={market.ticker}>
//               <TableCell className="font-medium">{market.ticker}</TableCell>
//               <TableCell className="text-right">${market.price.toFixed(2)}</TableCell>
//               <TableCell className={`text-right ${market.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
//                 <span className="flex items-center justify-end gap-1">
//                   {market.change >= 0 ? (
//                     <ArrowUp className="h-4 w-4" />
//                   ) : (
//                     <ArrowDown className="h-4 w-4" />
//                   )}
//                   {market.changePercent.toFixed(2)}%
//                 </span>
//               </TableCell>
//               <TableCell className="text-right">{market.volume.toLocaleString()}</TableCell>
//               <TableCell className="text-right">${market.high.toFixed(2)}</TableCell>
//               <TableCell className="text-right">${market.low.toFixed(2)}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   )
// }
//
