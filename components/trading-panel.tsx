import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';

// All the props this component will need from the parent
interface TradingPanelProps {
  selectedTicker: any;
  tickers: any[];
  orderType: 'BUY' | 'SELL';
  setOrderType: (type: 'BUY' | 'SELL') => void;
  volume: string;
  setVolume: (value: string) => void;
  leverage: string;
  setLeverage: (value: string) => void;
  calculateMargin: () => string;
  balance: number | null;
  advancedOpen: boolean;
  setAdvancedOpen: (isOpen: boolean) => void;
  takeProfitEnabled: boolean;
  setTakeProfitEnabled: (isEnabled: boolean) => void;
  takeProfit: string;
  setTakeProfit: (value: string) => void;
  stopLossEnabled: boolean;
  setStopLossEnabled: (isEnabled: boolean) => void;
  stopLoss: string;
  setStopLoss: (value: string) => void;
  handlePlaceOrder: () => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  selectedTicker,
  tickers,
  orderType,
  setOrderType,
  volume,
  setVolume,
  leverage,
  setLeverage,
  calculateMargin,
  balance,
  advancedOpen,
  setAdvancedOpen,
  takeProfitEnabled,
  setTakeProfitEnabled,
  takeProfit,
  setTakeProfit,
  stopLossEnabled,
  setStopLossEnabled,
  stopLoss,
  setStopLoss,
  handlePlaceOrder,
}) => {
  const { t } = useI18n();

  if (!selectedTicker) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
          </div>
          <p className="text-sm text-gray-500">{t("selectTickerToStart")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center py-2 space-x-4">
          <span className="text-xl font-mono">
            $ {tickers.find((d) => d.symbol === selectedTicker.symbol)?.bid ?? '0'}
          </span>
        </div>
        <div className="flex space-x-1">
          <Button onClick={() => setOrderType('BUY')} size="sm" className={`flex-1 h-8 text-xs ${orderType === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {t("buyUpper")}
          </Button>
          <Button onClick={() => setOrderType('SELL')} size="sm" className={`flex-1 h-8 text-xs ${orderType === 'SELL' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {t("sellUpper")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">{orderType === 'BUY' ? t("longPosition") : t("shortPosition")}</span>
            <span className="text-xs font-mono">
              ${typeof selectedTicker.price === 'number' ? selectedTicker.price.toLocaleString() : '0'}
            </span>
          </div>
          <div className="text-xs text-gray-500">{t("currentPrice")}</div>
        </div>
        <div>
          <Label htmlFor="volume" className="text-xs text-gray-300">{t("volume")}</Label>
          <Input id="volume" value={volume} onChange={(e) => setVolume(e.target.value)} className="bg-gray-700 border-gray-600 text-white mt-1 h-8" placeholder="0.01" />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{t("estMargin")}</span>
          <span className="font-mono">${calculateMargin()}</span>
        </div>
        {Number.parseFloat(calculateMargin()) > (balance || 0) && (
          <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
            {t("insufficientBalance").replace("${required}", calculateMargin()).replace("${available}", (balance || 0).toString())}
          </div>
        )}
        <div>
          <Label htmlFor="leverage" className="text-xs text-gray-300">{t("leverage")}</Label>
          <Select value={leverage} onValueChange={setLeverage}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1 h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="1">1:1</SelectItem>
              <SelectItem value="5">1:5</SelectItem>
              <SelectItem value="10">1:10</SelectItem>
              <SelectItem value="25">1:25</SelectItem>
              <SelectItem value="50">1:50</SelectItem>
              <SelectItem value="100">1:100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-gray-300 hover:text-white">
            <span>{t("advancedOptions")}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="take-profit" className="text-xs text-gray-300">{t("takeProfit")}</Label>
              <Switch id="take-profit" checked={takeProfitEnabled} onCheckedChange={setTakeProfitEnabled} />
            </div>
            {takeProfitEnabled && (<Input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="bg-gray-700 border-gray-600 text-white h-8" placeholder={t("enterTpPrice")} />)}
            <div className="flex items-center justify-between">
              <Label htmlFor="stop-loss" className="text-xs text-gray-300">{t("stopLoss")}</Label>
              <Switch id="stop-loss" checked={stopLossEnabled} onCheckedChange={setStopLossEnabled} />
            </div>
            {stopLossEnabled && (<Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="bg-gray-700 border-gray-600 text-white h-8" placeholder={t("enterSlPrice")} />)}
          </CollapsibleContent>
        </Collapsible>
        <Button onClick={handlePlaceOrder} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9" disabled={!selectedTicker || Number.parseFloat(calculateMargin()) > (balance || 0)}>
          {t("placeOrder").replace("{type}", orderType)}
        </Button>
      </CardContent>
    </Card>
  );
}; 