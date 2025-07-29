"use client";
import {useEffect, useRef, useState} from "react";
import {Checker} from "@/components/Checker";
import DiceRoll from "@/components/DiceRoll";
import {
    calculateCordY,
    generateDefaultCheckersData,
    getDirection,
    getRealPoint,
    sliceString,
    togglePlayer
} from "@/lib/helpers";
import {BAR_COORDS, POINT_COORDS} from "@/lib/boardData";

type Player = "first" | "second";

export interface PlayerInfo {
    name: string;
    score: number;
}

interface GameData {
    "first": PlayerInfo,
    "second": PlayerInfo,
    "point_match": 1,
    "turns": Turn[]
}

interface Move {
    "from": string,
    "to": string,
    "captured": boolean
}

export interface Turn {
    "turn": Player,
    "dice": [
        number,
        number
    ],
    "cube_owner": null | Player,
    "cube_value": number,
    "moves": Move[]
}

export type CheckerData = {
    id: string;
    player: Player;
    index: number;
    x: number;
    y: number;
    direction: 1 | -1;
    sortOrder: number;
    currentPosition: string;
    check: boolean;
    delay?: number;
};


export default function Board() {
    const [data, setData] = useState<GameData | null>(null);
    const [currentTurn, setCurrentTurn] = useState(-1);
    const [lastTurn, setLastTurn] = useState(-2);
    const [gameDirection, setGameDirection] = useState(1);
    const [checkers, setCheckers] = useState<CheckerData[]>(generateDefaultCheckersData());
    const screenBlockRef = useRef<HTMLDivElement | null>(null);
    const handleScreenshot = async () => {
        if (!screenBlockRef.current) return;
        const result = await fetch('/api/screenshot', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                state: {
                    checkers,
                    "first": data?.first,
                    "second": data?.second,
                    "point_match": data?.point_match,
                    currentTurn: data?.turns[currentTurn],
                },
            }),
        });

        const blob = await result.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'board.png';
        link.click();
    };

    useEffect(() => {
        fetch("/game.json")
            .then((res) => res.json())
            .then(setData);
    }, []);


    useEffect(() => {
        if (!data) return;
        const turn = data.turns[currentTurn];
        if (!turn) return;

        // Создаем копию массива с обновленными значениями
        let newCheckers = checkers.map(checker => ({
            ...checker,
            check: false,
            delay: 0
        }));

        let i = 0;
        const player = turn.turn;

        const moves = currentTurn > lastTurn ? turn.moves : turn.moves.reverse();

        for (let {from, to, captured} of moves) {
            const otherPlayer = togglePlayer(player);

            if (currentTurn > lastTurn) {
                from = getRealPoint(from, player);
                to = getRealPoint(to, player);
            } else {
                const acc = from;
                from = getRealPoint(to, player);
                to = getRealPoint(acc, player);
            }

            if (captured) {
                if (currentTurn > lastTurn) {
                    const foundChecker = newCheckers.find(el => el.currentPosition === to && el.player === otherPlayer);
                    const found = newCheckers.filter(c => c.currentPosition === 'Bar' && c.player === otherPlayer);
                    const maxIndex = found.reduce((acc, curr) => curr.index > acc ? curr.index : acc, -1);

                    if (foundChecker) {
                        foundChecker.currentPosition = 'Bar';
                        foundChecker.x = BAR_COORDS[otherPlayer].x;
                        foundChecker.index = maxIndex + 1;
                        foundChecker.y = calculateCordY(BAR_COORDS[otherPlayer].y, maxIndex + 1, getDirection('Bar', player));
                        foundChecker.check = true;
                        foundChecker.delay = 1 + i * 0.1;
                        i++;
                    }
                } else {
                    const foundChecker = newCheckers.find(el => el.currentPosition === 'Bar' && el.player === otherPlayer);
                    const found = newCheckers.filter(c => c.currentPosition === from && c.player === otherPlayer);
                    const maxIndex = found.reduce((acc, curr) => curr.index > acc ? curr.index : acc, -1);

                    if (foundChecker) {
                        foundChecker.currentPosition = from;
                        foundChecker.x = POINT_COORDS[from].x;
                        foundChecker.index = maxIndex + 1;
                        foundChecker.y = calculateCordY(POINT_COORDS[from].y, maxIndex + 1, getDirection(to, player));
                        foundChecker.check = true;
                        foundChecker.delay = 1 + i * 0.1;
                        i++;
                    }
                }
            }

            const currentChecker = newCheckers.reduce((acc, curr) => {
                if (Number(from) < 13) {
                    return curr.y < (acc?.y ?? Infinity) && curr.currentPosition === from && curr.player === player ? curr : acc;
                }
                return curr.y > (acc?.y ?? -Infinity) && curr.currentPosition === from && curr.player === player ? curr : acc;
            }, undefined as CheckerData | undefined);

            const maxIndex = newCheckers.reduce((acc, curr) => {
                return curr.index > (acc?.index ?? -Infinity) && curr.currentPosition === to && curr.player === player ? curr : acc;
            }, undefined as CheckerData | undefined)?.index ?? -1;

            if (currentChecker) {
                currentChecker.currentPosition = to;
                currentChecker.x = to === 'Bar' ? BAR_COORDS[player].x : POINT_COORDS[to].x;
                currentChecker.index = maxIndex + 1;
                currentChecker.y = calculateCordY(to === 'Bar' ? BAR_COORDS[player].y : POINT_COORDS[to].y, maxIndex + 1, getDirection(to, player));
                currentChecker.check = true;
                currentChecker.delay = 1 + i * 0.1;
                i++;
            }
        }

        // Обновляем состояние
        setCheckers(newCheckers);
    }, [data, currentTurn, lastTurn]);

    if (!data) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <span className="loader"></span>
            </div>
        );
    }

    return (
        <div className="w-full main p-2">
            <div ref={screenBlockRef} style={{backgroundColor: '#fff8e7'}}>
                <div className="header">
                    <div className="header_item justify-start">
                        <div className="checker checker--first">
                            {data.turns[currentTurn]?.turn === 'first' && (
                                <svg xmlns="http://www.w3.org/2000/svg"
                                     viewBox="0 0 48 48">
                                    <path fill="#43A047"
                                          d="M40.6 12.1L17 35.7 7.4 26.1 4.6 29 17 41.3 43.4 14.9z"></path>
                                </svg>)}
                        </div>
                        <div className="score">{data.first.score}</div>
                    </div>
                    <div className="font-sans p-2 text-lg">:</div>
                    <div className="header_item justify-end">
                        <div className="score">{data.second.score}</div>
                        <div className="checker checker--second">
                            {data.turns[currentTurn]?.turn === 'second' && (
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100"
                                     viewBox="0 0 48 48">
                                    <path fill="#43A047"
                                          d="M40.6 12.1L17 35.7 7.4 26.1 4.6 29 17 41.3 43.4 14.9z"></path>
                                </svg>)}
                        </div>
                    </div>
                    <div className="name text-left">{sliceString(data.first.name)}</div>
                    <div className="text-center">Матч до {data.point_match}</div>
                    <div className="name text-right">{sliceString(data.second.name)}</div>
                </div>

                <div className="board">
                    {checkers.map((checker) => (
                        <Checker key={checker.id} {...checker} />
                    ))}
                </div>

                <div className="turns">
                    <div
                        className={`turns-info p-2 ${data.turns[currentTurn]?.turn === 'first' && 'turns-info--active'}`}>
                        {data.turns[currentTurn]?.turn === 'first' &&
                            data.turns[currentTurn].moves.map(({
                                                                   from,
                                                                   to,
                                                                   captured
                                                               }, id) => (
                                <span key={id}>{`${from}/${to}${captured ? '*' : ''}`}</span>
                            ))}
                    </div>
                    <DiceRoll dice={data.turns[currentTurn]?.dice.length ? data.turns[currentTurn].dice : [0, 0]}
                              size={48}/>
                    <div
                        className={`turns-info p-2 ${data.turns[currentTurn]?.turn === 'second' && 'turns-info--active'}`}>
                        {data.turns[currentTurn]?.turn === 'second' &&
                            data.turns[currentTurn].moves.map(({
                                                                   from,
                                                                   to,
                                                                   captured
                                                               }, id) => (
                                <span key={id}>{`${from}/${to}${captured ? '*' : ''}`}</span>
                            ))}
                    </div>
                </div>

            </div>

            {data && <div className="bottom-buttons">
                <button
                    onClick={() => {
                        if (gameDirection == -1) {
                            setLastTurn((t) => Math.max(t - 1, -1))
                            setCurrentTurn((t) => Math.max(t - 1, -1));
                        } else {
                            setLastTurn(currentTurn)
                            setGameDirection(-1)
                        }
                    }}
                    className="rounded-md w-full button"
                    data-orientation="left"
                />
                <span/>
                <button
                    onClick={() => {
                        if (gameDirection == 1) {
                            setLastTurn(currentTurn)
                            setCurrentTurn((t) => Math.min(t + 1, data.turns.length - 1))
                        } else {
                            setLastTurn((t) => t - 1)
                            setGameDirection(1)
                        }
                    }}
                    className="rounded-md w-full button"
                    data-orientation="right"
                />
            </div>}
            <div className="flex justify-center">
                <button className="mt-2 rounded-md bg-slate-800 p-2 text-white" onClick={handleScreenshot}>
                    <svg className="screen" viewBox="0 0 24 24" fill="none"
                         xmlns="http://www.w3.org/2000/svg">
                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                            <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"></circle>
                            <path
                                d="M2 13.3636C2 10.2994 2 8.76721 2.74902 7.6666C3.07328 7.19014 3.48995 6.78104 3.97524 6.46268C4.69555 5.99013 5.59733 5.82123 6.978 5.76086C7.63685 5.76086 8.20412 5.27068 8.33333 4.63636C8.52715 3.68489 9.37805 3 10.3663 3H13.6337C14.6219 3 15.4728 3.68489 15.6667 4.63636C15.7959 5.27068 16.3631 5.76086 17.022 5.76086C18.4027 5.82123 19.3044 5.99013 20.0248 6.46268C20.51 6.78104 20.9267 7.19014 21.251 7.6666C22 8.76721 22 10.2994 22 13.3636C22 16.4279 22 17.9601 21.251 19.0607C20.9267 19.5371 20.51 19.9462 20.0248 20.2646C18.9038 21 17.3433 21 14.2222 21H9.77778C6.65675 21 5.09624 21 3.97524 20.2646C3.48995 19.9462 3.07328 19.5371 2.74902 19.0607C2.53746 18.7498 2.38566 18.4045 2.27673 18"
                                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                            <path d="M19 10H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                        </g>
                    </svg>
                </button>
            </div>
        </div>
    );
}
