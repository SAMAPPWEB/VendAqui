import React, { useState, useEffect } from "react";
import { Waves, MapPin, ArrowUp, ArrowDown } from "phosphor-react";

interface TideData {
    time: string;
    height: string;
    type: 'ALTA' | 'BAIXA';
}

const TideWidget: React.FC = () => {
    const [tide, setTide] = useState<TideData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulação de dados para Porto Seguro - No futuro integrar com API real (ex: StormGlass ou Brasil APIs)
        const fetchTide = async () => {
            setLoading(true);
            try {
                // Simulando delay de rede
                await new Promise(resolve => setTimeout(resolve, 800));

                const now = new Date();
                const hour = now.getHours();

                let mockTide: TideData;

                if (hour < 10) {
                    mockTide = { time: "09:45", height: "2.1m", type: "ALTA" };
                } else if (hour < 16) {
                    mockTide = { time: "15:20", height: "0.4m", type: "BAIXA" };
                } else {
                    mockTide = { time: "22:10", height: "1.9m", type: "ALTA" };
                }

                setTide(mockTide);
            } catch (e) {
                console.error("Erro ao carregar maré:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchTide();
    }, []);

    if (loading) return null;

    return (
        <div className="hidden sm:flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-full select-none cursor-default">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tide?.type === 'ALTA' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                <Waves size={16} weight="fill" />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-gray-900 uppercase leading-none">Maré {tide?.type}</span>
                    {tide?.type === 'ALTA' ? <ArrowUp size={8} weight="bold" className="text-blue-500" /> : <ArrowDown size={8} weight="bold" className="text-orange-500" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-blue-600 leading-none">{tide?.height} às {tide?.time}</span>
                    <div className="flex items-center gap-0.5 opacity-40">
                        <MapPin size={8} weight="bold" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">Porto Seguro</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TideWidget;
