'use client';
import {useEffect, useState, Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import {CheckerData, PlayerInfo, Turn} from "@/components/Board";
import {sliceString} from "@/lib/helpers";
import {Checker} from "@/components/Checker";
import DiceRoll from "@/components/DiceRoll";

interface Data {
    checkers: CheckerData[];
    first: PlayerInfo;
    point_match: number;
    second: PlayerInfo;
    currentTurn: Turn;
}

export default function InnerScreenshotClient() {
    const searchParams = useSearchParams();
    const [state, setState] = useState<Data | null>(null);
    console.log("%c 1 --> Line: 11||page.tsx\n state: ", "color:#f0f;", state);

    useEffect(() => {
        const stateParam = searchParams.get('state');
        if (!stateParam) return;

        const data = JSON.parse(decodeURIComponent(stateParam));
        setState(data);
    }, [searchParams]);

    if (!state) return <></>;

    return (
        <div style={{backgroundColor: '#fff8e7'}} className='p-2'>
            <div className="header">
                <div className="header_item justify-start">
                    <div className="checker checker--first">
                        {state.currentTurn.turn === 'first' && (
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 viewBox="0 0 48 48">
                                <path fill="#43A047"
                                      d="M40.6 12.1L17 35.7 7.4 26.1 4.6 29 17 41.3 43.4 14.9z"></path>
                            </svg>)}
                    </div>
                    <div className="score">{state?.first.score}</div>
                </div>
                <div className="font-sans p-2 text-lg">:</div>
                <div className="header_item justify-end">
                    <div className="score">{state?.second.score}</div>
                    <div className="checker checker--second">
                        {state?.currentTurn.turn === 'second' && (
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100"
                                 viewBox="0 0 48 48">
                                <path fill="#43A047"
                                      d="M40.6 12.1L17 35.7 7.4 26.1 4.6 29 17 41.3 43.4 14.9z"></path>
                            </svg>)}
                    </div>
                </div>
                <div className="name text-left">{sliceString(state?.first.name || '')}</div>
                <div className="text-center">Матч до {state?.point_match}</div>
                <div className="name text-right">{sliceString(state?.second.name || '')}</div>
            </div>

            <div className="board">
                {state.checkers.map((checker) => (
                    <Checker key={checker.id} {...checker} />
                ))}
            </div>

            <div className="turns">
                <div
                    className={`turns-info p-2 ${state.currentTurn.turn === 'first' && 'turns-info--active'}`}>
                    {state.currentTurn.turn === 'first' &&
                        state.currentTurn.moves.map(({
                                                         from,
                                                         to,
                                                         captured
                                                     }, id) => (
                            <span key={id}>{`${from}/${to}${captured ? '*' : ''}`}</span>
                        ))}
                </div>
                <DiceRoll dice={state.currentTurn.dice.length ? state.currentTurn.dice : [0, 0]}
                          size={48} notAnimated/>
                <div
                    className={`turns-info p-2 ${state.currentTurn.turn === 'second' && 'turns-info--active'}`}>
                    {state.currentTurn.turn === 'second' &&
                        state.currentTurn.moves.map(({
                                                         from,
                                                         to,
                                                         captured
                                                     }, id) => (
                            <span key={id}>{`${from}/${to}${captured ? '*' : ''}`}</span>
                        ))}
                </div>
            </div>
        </div>
    );
}

export const ScreenshotClient = () => (
    <Suspense fallback={<div>Загрузка...</div>}>
        <InnerScreenshotClient/>
    </Suspense>
)