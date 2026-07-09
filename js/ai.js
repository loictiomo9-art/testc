class ChessAI {
    constructor(engine, strength = 1500) {
        this.engine = engine;
        this.strength = strength;
        this.maxDepth = this.calculateDepth(strength);
        this.pieceValues = {
            'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
        };
    }
    
    calculateDepth(elo) {
        // Ajustement de la profondeur selon le niveau ELO
        if (elo <= 1000) return 1;
        if (elo <= 1200) return 2;
        if (elo <= 1400) return 2;
        if (elo <= 1600) return 3;
        if (elo <= 1800) return 3;
        return 4;
    }
    
    evaluateBoard() {
        let score = 0;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.engine.board[r][c];
                if (!piece) continue;
                
                const pieceType = piece.toLowerCase();
                const value = this.pieceValues[pieceType] || 0;
                
                // Bonus de position pour les pièces
                const positionBonus = this.getPositionBonus(piece, r, c);
                
                if (piece === piece.toUpperCase()) {
                    // Pièce blanche (joueur)
                    score += value + positionBonus;
                } else {
                    // Pièce noire (IA)
                    score -= value + positionBonus;
                }
            }
        }
        
        // Bonus pour le contrôle du centre
        const centerControl = this.evaluateCenterControl();
        score += centerControl;
        
        return score;
    }
    
    getPositionBonus(piece, row, col) {
        const pieceType = piece.toLowerCase();
        const isWhite = piece === piece.toUpperCase();
        const r = isWhite ? row : 7 - row;
        const c = col;
        
        // Tables simplifiées de bonus positionnels
        const pawnTable = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ];
        
        const knightTable = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ];
        
        const bishopTable = [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ];
        
        if (pieceType === 'p') return pawnTable[r][c];
        if (pieceType === 'n') return knightTable[r][c];
        if (pieceType === 'b') return bishopTable[r][c];
        
        return 0;
    }
    
    evaluateCenterControl() {
        let score = 0;
        const center = [[3, 3], [3, 4], [4, 3], [4, 4]];
        
        for (const [r, c] of center) {
            const piece = this.engine.board[r][c];
            if (piece) {
                if (piece === piece.toUpperCase()) score += 10;
                else score -= 10;
            }
        }
        
        return score;
    }
    
    minimax(depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return this.evaluateBoard();
        }
        
        const moves = this.engine.getAllPseudoLegalMoves(
            isMaximizing ? 'white' : 'black'
        );
        
        if (moves.length === 0) {
            if (this.engine.isInCheck(isMaximizing ? 'white' : 'black')) {
                return isMaximizing ? -99999 : 99999;
            }
            return 0;
        }
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const savedState = this.engine.getBoardState();
                this.engine.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
                const evaluation = this.minimax(depth - 1, alpha, beta, false);
                this.engine.board = savedState.board;
                this.engine.currentPlayer = savedState.currentPlayer;
                this.engine.moveHistory = savedState.moveHistory;
                this.engine.capturedPieces = savedState.capturedPieces;
                this.engine.lastMove = savedState.lastMove;
                this.engine.gameOver = savedState.gameOver;
                this.engine.gameResult = savedState.gameResult;
                this.engine.kingPositions = savedState.kingPositions;
                this.engine.castlingRights = savedState.castlingRights;
                this.engine.enPassantTarget = savedState.enPassantTarget;
                
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const savedState = this.engine.getBoardState();
                this.engine.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
                const evaluation = this.minimax(depth - 1, alpha, beta, true);
                this.engine.board = savedState.board;
                this.engine.currentPlayer = savedState.currentPlayer;
                this.engine.moveHistory = savedState.moveHistory;
                this.engine.capturedPieces = savedState.capturedPieces;
                this.engine.lastMove = savedState.lastMove;
                this.engine.gameOver = savedState.gameOver;
                this.engine.gameResult = savedState.gameResult;
                this.engine.kingPositions = savedState.kingPositions;
                this.engine.castlingRights = savedState.castlingRights;
                this.engine.enPassantTarget = savedState.enPassantTarget;
                
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }
    
    getBestMove() {
        const moves = this.engine.getAllPseudoLegalMoves('black');
        if (moves.length === 0) return null;
        
        // Ajouter un peu d'aléatoire pour simuler un niveau 1500
        const randomFactor = Math.max(0, (1500 - this.strength) / 100);
        
        let bestMove = null;
        let bestScore = Infinity;
        
        // Trier les mouvements pour une meilleure efficacité
        moves.sort((a, b) => {
            const captureA = this.engine.board[a.toRow][a.toCol] ? 1 : 0;
            const captureB = this.engine.board[b.toRow][b.toCol] ? 1 : 0;
            return captureB - captureA;
        });
        
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const savedState = this.engine.getBoardState();
            
            this.engine.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
            const score = this.minimax(this.maxDepth - 1, -Infinity, Infinity, true);
            
            this.engine.board = savedState.board;
            this.engine.currentPlayer = savedState.currentPlayer;
            this.engine.moveHistory = savedState.moveHistory;
            this.engine.capturedPieces = savedState.capturedPieces;
            this.engine.lastMove = savedState.lastMove;
            this.engine.gameOver = savedState.gameOver;
            this.engine.gameResult = savedState.gameResult;
            this.engine.kingPositions = savedState.kingPositions;
            this.engine.castlingRights = savedState.castlingRights;
            this.engine.enPassantTarget = savedState.enPassantTarget;
            
            // Ajouter du bruit aléatoire
            const noise = (Math.random() - 0.5) * randomFactor * 50;
            const finalScore = score + noise;
            
            if (finalScore < bestScore) {
                bestScore = finalScore;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    }
