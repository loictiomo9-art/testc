class ChessEngine {
    constructor() {
        this.reset();
    }
    
    reset() {
        // Initialisation du plateau
        this.board = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
        
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.lastMove = null;
        this.gameOver = false;
        this.gameResult = null;
        this.kingPositions = {
            white: { row: 7, col: 4 },
            black: { row: 0, col: 4 }
        };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
    }
    
    getPieceColor(piece) {
        if (!piece) return null;
        return piece === piece.toUpperCase() ? 'white' : 'black';
    }
    
    getPieceType(piece) {
        if (!piece) return null;
        const type = piece.toLowerCase();
        const types = { 'p': 'pawn', 'r': 'rook', 'n': 'knight', 'b': 'bishop', 'q': 'queen', 'k': 'king' };
        return types[type];
    }
    
    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const color = this.getPieceColor(piece);
        const type = this.getPieceType(piece);
        const moves = [];
        
        const addMove = (toRow, toCol) => {
            if (!this.isInBounds(toRow, toCol)) return false;
            const targetPiece = this.board[toRow][toCol];
            if (targetPiece && this.getPieceColor(targetPiece) === color) return false;
            
            // Simuler le mouvement pour vérifier l'échec
            const originalBoard = this.board.map(r => [...r]);
            const originalEnPassant = this.enPassantTarget;
            const originalCastling = JSON.parse(JSON.stringify(this.castlingRights));
            
            this.board[toRow][toCol] = piece;
            this.board[row][col] = '';
            
            if (!this.isInCheck(color)) {
                moves.push({ row: toRow, col: toCol });
            }
            
            this.board = originalBoard;
            this.enPassantTarget = originalEnPassant;
            this.castlingRights = originalCastling;
            
            return true;
        };
        
        const addSlidingMoves = (directions) => {
            for (const [dr, dc] of directions) {
                let r = row + dr;
                let c = col + dc;
                while (this.isInBounds(r, c)) {
                    const targetPiece = this.board[r][c];
                    if (targetPiece) {
                        if (this.getPieceColor(targetPiece) !== color) {
                            addMove(r, c);
                        }
                        break;
                    }
                    addMove(r, c);
                    r += dr;
                    c += dc;
                }
            }
        };
        
        switch (type) {
            case 'pawn':
                const direction = color === 'white' ? -1 : 1;
                const startRow = color === 'white' ? 6 : 1;
                
                // Avance d'une case
                if (!this.board[row + direction]?.[col]) {
                    addMove(row + direction, col);
                    
                    // Avance de deux cases
                    if (row === startRow && !this.board[row + 2 * direction]?.[col]) {
                        addMove(row + 2 * direction, col);
                    }
                }
                
                // Capture diagonale
                for (const dc of [-1, 1]) {
                    const captureRow = row + direction;
                    const captureCol = col + dc;
                    if (this.isInBounds(captureRow, captureCol)) {
                        const targetPiece = this.board[captureRow][captureCol];
                        if (targetPiece && this.getPieceColor(targetPiece) !== color) {
                            addMove(captureRow, captureCol);
                        }
                    }
                }
                
                // En passant
                if (this.enPassantTarget) {
                    const [epRow, epCol] = this.enPassantTarget;
                    if (epRow === row + direction && Math.abs(epCol - col) === 1) {
                        addMove(epRow, epCol);
                    }
                }
                break;
                
            case 'rook':
                addSlidingMoves([[0, 1], [0, -1], [1, 0], [-1, 0]]);
                break;
                
            case 'knight':
                const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
                for (const [dr, dc] of knightMoves) {
                    addMove(row + dr, col + dc);
                }
                break;
                
            case 'bishop':
                addSlidingMoves([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
                break;
                
            case 'queen':
                addSlidingMoves([[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
                break;
                
            case 'king':
                const kingMoves = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dr, dc] of kingMoves) {
                    addMove(row + dr, col + dc);
                }
                
                // Roque
                if (color === 'white' && row === 7 && col === 4) {
                    if (this.castlingRights.white.kingSide &&
                        !this.board[7][5] && !this.board[7][6] &&
                        this.board[7][7] === 'R' &&
                        !this.isSquareAttacked(7, 4, 'black') &&
                        !this.isSquareAttacked(7, 5, 'black') &&
                        !this.isSquareAttacked(7, 6, 'black')) {
                        moves.push({ row: 7, col: 6 });
                    }
                    if (this.castlingRights.white.queenSide &&
                        !this.board[7][3] && !this.board[7][2] && !this.board[7][1] &&
                        this.board[7][0] === 'R' &&
                        !this.isSquareAttacked(7, 4, 'black') &&
                        !this.isSquareAttacked(7, 3, 'black') &&
                        !this.isSquareAttacked(7, 2, 'black')) {
                        moves.push({ row: 7, col: 2 });
                    }
                } else if (color === 'black' && row === 0 && col === 4) {
                    if (this.castlingRights.black.kingSide &&
                        !this.board[0][5] && !this.board[0][6] &&
                        this.board[0][7] === 'r' &&
                        !this.isSquareAttacked(0, 4, 'white') &&
                        !this.isSquareAttacked(0, 5, 'white') &&
                        !this.isSquareAttacked(0, 6, 'white')) {
                        moves.push({ row: 0, col: 6 });
                    }
                    if (this.castlingRights.black.queenSide &&
                        !this.board[0][3] && !this.board[0][2] && !this.board[0][1] &&
                        this.board[0][0] === 'r' &&
                        !this.isSquareAttacked(0, 4, 'white') &&
                        !this.isSquareAttacked(0, 3, 'white') &&
                        !this.isSquareAttacked(0, 2, 'white')) {
                        moves.push({ row: 0, col: 2 });
                    }
                }
                break;
        }
        
        return moves;
    }
    
    isSquareAttacked(row, col, attackerColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && this.getPieceColor(piece) === attackerColor) {
                    const pieceType = this.getPieceType(piece);
                    
                    if (pieceType === 'pawn') {
                        const direction = attackerColor === 'white' ? -1 : 1;
                        if (r + direction === row && Math.abs(c - col) === 1) return true;
                    } else if (pieceType === 'knight') {
                        const dr = Math.abs(r - row);
                        const dc = Math.abs(c - col);
                        if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) return true;
                    } else if (pieceType === 'king') {
                        if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) return true;
                    } else {
                        // Pièces glissantes
                        const dr = r === row ? 0 : (r < row ? 1 : -1);
                        const dc = c === col ? 0 : (c < col ? 1 : -1);
                        
                        if (pieceType === 'rook' && (dr === 0 || dc === 0)) {
                            let valid = true;
                            let currentR = r + dr;
                            let currentC = c + dc;
                            while (currentR !== row || currentC !== col) {
                                if (this.board[currentR][currentC]) {
                                    valid = false;
                                    break;
                                }
                                currentR += dr;
                                currentC += dc;
                            }
                            if (valid) return true;
                        } else if (pieceType === 'bishop' && dr !== 0 && dc !== 0) {
                            let valid = true;
                            let currentR = r + dr;
                            let currentC = c + dc;
                            while (currentR !== row || currentC !== col) {
                                if (this.board[currentR][currentC]) {
                                    valid = false;
                                    break;
                                }
                                currentR += dr;
                                currentC += dc;
                            }
                            if (valid) return true;
                        } else if (pieceType === 'queen') {
                            let valid = true;
                            let currentR = r + dr;
                            let currentC = c + dc;
                            while (currentR !== row || currentC !== col) {
                                if (this.board[currentR][currentC]) {
                                    valid = false;
                                    break;
                                }
                                currentR += dr;
                                currentC += dc;
                            }
                            if (valid) return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    
    isInCheck(color) {
        const kingPos = this.kingPositions[color];
        return this.isSquareAttacked(kingPos.row, kingPos.col, color === 'white' ? 'black' : 'white');
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        const color = this.getPieceColor(piece);
        
        // Gestion de la capture
        if (capturedPiece) {
            const capturedColor = this.getPieceColor(capturedPiece);
            this.capturedPieces[color].push(capturedPiece);
        }
        
        // Gestion en passant
        if (this.getPieceType(piece) === 'pawn' && toRow === this.enPassantTarget?.[0] && toCol === this.enPassantTarget?.[1]) {
            const capturedPawnRow = color === 'white' ? toRow + 1 : toRow - 1;
            const capturedPawn = this.board[capturedPawnRow][toCol];
            this.capturedPieces[color].push(capturedPawn);
            this.board[capturedPawnRow][toCol] = '';
        }
        
        // Exécution du mouvement
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = '';
        
        // Mise à jour de la position du roi
        if (this.getPieceType(piece) === 'king') {
            this.kingPositions[color] = { row: toRow, col: toCol };
            
            // Roque
            if (Math.abs(fromCol - toCol) === 2) {
                if (toCol === 6) {
                    this.board[toRow][5] = this.board[toRow][7];
                    this.board[toRow][7] = '';
                } else if (toCol === 2) {
                    this.board[toRow][3] = this.board[toRow][0];
                    this.board[toRow][0] = '';
                }
            }
        }
        
        // Mise à jour des droits de roque
        if (piece === 'K') {
            this.castlingRights.white.kingSide = false;
            this.castlingRights.white.queenSide = false;
        } else if (piece === 'k') {
            this.castlingRights.black.kingSide = false;
            this.castlingRights.black.queenSide = false;
        }
        
        if (fromRow === 7 && fromCol === 0 || toRow === 7 && toCol === 0) {
            this.castlingRights.white.queenSide = false;
        }
        if (fromRow === 7 && fromCol === 7 || toRow === 7 && toCol === 7) {
            this.castlingRights.white.kingSide = false;
        }
        if (fromRow === 0 && fromCol === 0 || toRow === 0 && toCol === 0) {
            this.castlingRights.black.queenSide = false;
        }
        if (fromRow === 0 && fromCol === 7 || toRow === 0 && toCol === 7) {
            this.castlingRights.black.kingSide = false;
        }
        
        // Mise à jour en passant
        if (this.getPieceType(piece) === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = [(fromRow + toRow) / 2, fromCol];
        } else {
            this.enPassantTarget = null;
        }
        
        // Ajout à l'historique
        const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece);
        this.moveHistory.push({
            piece,
            fromRow,
            fromCol,
            toRow,
            toCol,
            capturedPiece,
            notation: moveNotation
        });
        
        this.lastMove = { fromRow, fromCol, toRow, toCol };
        
        // Changement de joueur
        this.currentPlayer = color === 'white' ? 'black' : 'white';
        
        // Vérification de fin de partie
        this.checkGameEnd();
    }
    
    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece) {
        const pieceType = this.getPieceType(piece);
        let notation = '';
        
        if (pieceType === 'king' && Math.abs(fromCol - toCol) === 2) {
            return toCol === 6 ? 'O-O' : 'O-O-O';
        }
        
        if (pieceType !== 'pawn') {
            notation += piece.toUpperCase();
        }
        
        if (capturedPiece || (pieceType === 'pawn' && fromCol !== toCol)) {
            if (pieceType === 'pawn') {
                notation += String.fromCharCode(97 + fromCol);
            }
            notation += 'x';
        }
        
        notation += String.fromCharCode(97 + toCol);
        notation += (8 - toRow);
        
        // Vérification de promotion (simplifiée)
        if (pieceType === 'pawn' && (toRow === 0 || toRow === 7)) {
            notation += '=Q';
        }
        
        return notation;
    }
    
    checkGameEnd() {
        const color = this.currentPlayer;
        let hasValidMove = false;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && this.getPieceColor(piece) === color) {
                    const moves = this.getValidMoves(r, c);
                    if (moves.length > 0) {
                        hasValidMove = true;
                        break;
                    }
                }
            }
            if (hasValidMove) break;
        }
        
        if (!hasValidMove) {
            this.gameOver = true;
            if (this.isInCheck(color)) {
                this.gameResult = color === 'white' ? 'black' : 'white';
            } else {
                this.gameResult = 'draw';
            }
        }
        
        // Vérification du matériel insuffisant
        let pieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c]) {
                    pieces.push(this.board[r][c]);
                }
            }
        }
        
        if (pieces.length === 2) {
            this.gameOver = true;
            this.gameResult = 'draw';
        } else if (pieces.length === 3) {
            const nonKings = pieces.filter(p => this.getPieceType(p) !== 'king');
            if (nonKings.length === 1 && (this.getPieceType(nonKings[0]) === 'bishop' || this.getPieceType(nonKings[0]) === 'knight')) {
                this.gameOver = true;
                this.gameResult = 'draw';
            }
        }
    }
    
    getAllPseudoLegalMoves(color) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && this.getPieceColor(piece) === color) {
                    const validMoves = this.getValidMoves(r, c);
                    for (const move of validMoves) {
                        moves.push({ fromRow: r, fromCol: c, toRow: move.row, toCol: move.col });
                    }
                }
            }
        }
        return moves;
    }
    
    getBoardState() {
        return {
            board: this.board.map(row => [...row]),
            currentPlayer: this.currentPlayer,
            moveHistory: [...this.moveHistory],
            capturedPieces: JSON.parse(JSON.stringify(this.capturedPieces)),
            lastMove: this.lastMove,
            gameOver: this.gameOver,
            gameResult: this.gameResult,
            kingPositions: JSON.parse(JSON.stringify(this.kingPositions)),
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            enPassantTarget: this.enPassantTarget
        };
    }
              }
