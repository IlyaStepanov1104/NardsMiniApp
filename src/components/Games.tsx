'use client';
import {FC, useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import {GameData} from "@/components/types";
import Board from "@/components/Board";

export const Games: FC = () => {
    const params = useSearchParams();
    const dirName = params.get('game');
    const [games, setGames] = useState<GameData[] | null>(null);
    const [currentGameIndex, setCurrentGameIndex] = useState<number>(0);
    const [isGameFinished, setIsGameFinished] = useState<boolean>(false);
    const game = games ? games[currentGameIndex] : undefined;

    useEffect(() => {
        fetch(`/json/${dirName}/games.json`)
            .then((res) => res.json())
            .then(setGames);
    }, []);

    const handleNextGame = () => {
        if (!games) return;
        if (currentGameIndex < games.length - 1) {
            setCurrentGameIndex((t) => t + 1);
            setIsGameFinished(false);
        }
    };

    if (!games) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <span className="loader"></span>
            </div>
        );
    }

    return (
        <div className="relative">
            <Board key={currentGameIndex} gameData={game} setIsGameFinished={setIsGameFinished} chatId={params.get('chat_id')} />

            {isGameFinished && (
                <div
                    className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center text-white text-center z-50 cursor-pointer"
                    onClick={handleNextGame}
                >
                    <div className="text-3xl font-bold mb-4">Игра завершена</div>
                    <div className="text-lg">Нажмите в любом месте, чтобы перейти к следующей</div>
                </div>
            )}
        </div>
    );
};
