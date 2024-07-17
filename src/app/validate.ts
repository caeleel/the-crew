import { atomStore, checkMissionsAtom } from './atoms'
import {
  CardValue,
  getNumber,
  getSuit,
  isSub,
  Suit,
  SuitWithSubs,
} from './cards'
import { GameState, Player, Trick } from './game'
import { Mission, MissionStatus } from './missions'
import { findWinner } from './utils'

export const COLOR_SUITS: Suit[] = ['B', 'P', 'Y', 'G']

export function updateMissionStatuses(gameState: GameState) {
  const shouldCheckMissions = atomStore.get(checkMissionsAtom)
  if (!shouldCheckMissions) {
    return
  }

  gameState.players.forEach((player) => {
    const missionValidator = new MissionValidator(gameState, player)
    player.missions.forEach((mission) => {
      if (!mission.status) {
        mission.status = missionValidator.getStatus(mission)
      }
    })
  })
}

export class MissionValidator {
  private invalidGameState: boolean = false

  private captain: Player
  private otherPlayers: Player[]

  private playedTricks: Trick[]
  private wonTricks: Trick[]
  private lostTricks: Trick[]

  private playedCards: CardValue[]
  private wonCards: CardValue[]
  private lostCards: CardValue[]

  constructor(
    private gameState: GameState,
    private player: Player,
  ) {
    this.gameState = gameState
    this.player = player
    this.otherPlayers = gameState.players.filter((p) => p.seat !== player.seat)

    this.playedTricks = gameState.players.flatMap((p) => p.tricks)
    this.wonTricks = player.tricks
    this.lostTricks = this.otherPlayers.flatMap((p) => p.tricks)

    this.playedCards = this.playedTricks.flat().map(({ card }) => card)
    this.wonCards = this.wonTricks.flat().map(({ card }) => card)
    this.lostCards = this.lostTricks.flat().map(({ card }) => card)

    const _captain = gameState.players.find(
      (p: Player) => p.seat === gameState.captainSeat,
    )
    if (!_captain) {
      console.warn('could not find the captain', { players: gameState.players })
      this.invalidGameState = true
      this.captain = player // doesn't matter what we set here
    } else {
      this.captain = _captain
    }

    if (this.gameState.numPlayers < 3 || this.gameState.numPlayers > 5) {
      console.warn('unexpected number of players', {
        numPlayers: this.gameState.numPlayers,
      })
      this.invalidGameState = true
    }
  }

  ////////////////////////////////////////////////

  public getStatus(mission: Mission): MissionStatus {
    if (this.invalidGameState) {
      console.warn('invalid game state')
      return undefined
    }
    return this.passed(mission)
      ? 'pass'
      : this.failed(mission)
        ? 'fail'
        : undefined
  }

  private isGameOver = (): boolean => {
    return this.gameState.totalTricks === this.playedTricks.length
  }

  private passed(mission: Mission): boolean {
    if (mission.willWin) {
      // I will win {willWin} (and not {wontWinCards})
      return (
        mission.willWin.every(this.wonCard) &&
        !!mission.wontWinCards?.every(this.lostCard)
      )
    }
    if (mission.wontWinNumbers) {
      // I will win no {wontWinNumbers}
      return mission.wontWinNumbers.every(this.lostAllCardsForNumber)
    }
    if (mission.wontWinColors) {
      // I will win no {wontWinColors}
      return mission.wontWinColors.every(this.lostAllCardsInSuit)
    }
    if (mission.willWinWith) {
      // I will win with a {with} / I will win a {capturing} with {with}
      const { with: winWith, capturing: toCapture } = mission.willWinWith!
      return this.wonTricks.some(
        (trick) =>
          this.wonTrickWithNumber(trick, winWith) &&
          (!toCapture || this.trickContainsNumber(trick, toCapture)),
      )
    }
    if (mission.willWinWithSub) {
      // I will win {willWinWithSub} with a sub
      return this.wonTricks.some(
        (trick) =>
          this.wonTrickWithSub(trick) &&
          this.trickContainsCard(trick, mission.willWinWithSub!),
      )
    }
    if (mission.winNumber) {
      // I will win exactly/at least {count} # of {winNumber}
      const { target, count, exact } = mission.winNumber!
      const numWon = this.numCardsWonForNumber(target)
      if (exact) {
        const numPlayed = this.numCardsPlayedForNumber(target)
        return numWon === count && numPlayed === 4
      } else {
        return numWon >= count
      }
    }
    if (mission.winSuit) {
      // I will win exactly/at least {count} # of cards in the {winSuit}
      return mission.winSuit.every(({ suit, count, exact }) => {
        const numWon = this.numCardsWonInSuit(suit)
        if (exact) {
          const numPlayed = this.numCardsPlayedInSuit(suit)
          return numWon === count && numPlayed === 9
        } else {
          return numWon >= count
        }
      })
    }
    if (mission.numTricks !== undefined) {
      // TODO: implement trick order
      return this.isGameOver() && this.wonTricks.length === mission.numTricks
    }
    if (mission.firstNTricks) {
      // TODO: implement trick order
    }
    if (mission.noneOfTheFirst) {
      // TODO: implement trick order
    }
    if (mission.nInARow) {
      // TODO: implement trick order
    }
    if (mission.notNInARow) {
      // TODO: implement trick order
    }
    if (mission.notOpenWith) {
      // I will not open a trick with {notOpenWith}
      return mission.notOpenWith.every(
        (suit) =>
          this.playedAllCardsInSuit(suit) &&
          this.playedTricks.every(
            (trick) => !this.ledTrickWithSuit(trick, suit),
          ),
      )
    }
    if (mission.special === 'allInOne') {
      // I will win all the cards in at least one of the 4 colors
      return COLOR_SUITS.some((color) => this.wonAllCardsInSuit(color))
    }
    if (mission.special === 'oneInAll') {
      // I will win at least one card of each color
      return COLOR_SUITS.every(this.wonSuit)
    }
    if (mission.oddOrEven) {
      // I will win a trick that contains only odd/even-numbered cards
      const matchesMissionParity = (x: number) =>
        x % 2 === (mission.oddOrEven === 'odd' ? 1 : 0)
      return this.wonTricks.some((trick) =>
        trick.every(
          ({ card }) => !isSub(card) && matchesMissionParity(getNumber(card)),
        ),
      )
    }
    if (mission.finalTrickCapture) {
      // TODO: implement trick order
    }
    if (mission.relativeToCaptain) {
      // I will win more/fewer/as many tricks as the captain
      const numCaptainTricks = this.captain?.tricks.length ?? 0
      const numTricksLeft =
        this.gameState.totalTricks - this.playedTricks.length
      switch (mission.relativeToCaptain!) {
        case 'more':
          return this.wonTricks.length > numCaptainTricks + numTricksLeft
        case 'fewer':
          return this.wonTricks.length + numTricksLeft < numCaptainTricks
        case 'as many':
          return (
            numTricksLeft === 0 && this.wonTricks.length === numCaptainTricks
          )
        case 'moreCombined':
          console.warn('unexpected mission', mission)
          return false
      }
    }
    if (mission.relativeToOthers) {
      const otherNumTricks = this.otherPlayers.map((p) => p.tricks.length)
      const numTricksLeft =
        this.gameState.totalTricks - this.playedTricks.length
      switch (mission.relativeToOthers!) {
        case 'more':
          return (
            this.wonTricks.length > Math.max(...otherNumTricks) + numTricksLeft
          )
        case 'fewer':
          return (
            this.wonTricks.length + numTricksLeft < Math.min(...otherNumTricks)
          )
        case 'as many':
          console.warn('unexpected mission', mission)
          return false
        case 'moreCombined':
          // I will win more tricks than everyone else combined
          const allOtherTricks = this.otherPlayers.flatMap((p) => p.tricks)
          return this.wonTricks.length > allOtherTricks.length + numTricksLeft
      }
    }
    if (mission.allCardsGreaterOrLessThan) {
      // I will win a trick where all cards are greater/less than {lessOrGreater}
      const { value, lessOrGreater } = mission.allCardsGreaterOrLessThan
      const fulfillsCompare = (card: CardValue) =>
        lessOrGreater === 'greater'
          ? getNumber(card) > value
          : getNumber(card) < value
      return this.wonTricks.some((trick) =>
        trick.every(({ card }) => !isSub(card) && fulfillsCompare(card)),
      )
    }
    if (mission.totalLessThan || mission.totalGreaterThan) {
      // I will win a mission where {totalGreaterThan} < total value < {totalLessThan}
      const lower = mission.totalGreaterThan?.[this.gameState.numPlayers - 3]
      const upper = mission.totalLessThan?.[this.gameState.numPlayers - 3]

      return this.wonTricks.some((trick) => {
        const sum = this.sumOfTrick(trick)
        return (
          !this.trickContainsSub(trick) &&
          (lower === undefined || lower < sum) &&
          (upper === undefined || sum < upper)
        )
      })
    }
    if (mission.equalInTrick) {
      // In one trick, I will win equal amounts of {equalInTrick} suits
      const suitCountInTrick = (trick: Trick, suit: SuitWithSubs) =>
        trick.filter(({ card }) => getSuit(card) === suit).length
      return this.wonTricks.some(
        (trick) =>
          suitCountInTrick(trick, mission.equalInTrick![0]) ===
          suitCountInTrick(trick, mission.equalInTrick![1]),
      )
    }
    if (mission.comparison) {
      // In total, I will win {suit1} > {suit2} / In total, I will win {suit1} = {suit2}
      const [suit1, suit2] = mission.comparison.suits
      switch (mission.comparison.comparator) {
        case '>': {
          if (this.playedAllCardsInSuit(suit1)) {
            return true
          }
          if (
            this.numCardsWonInSuit(suit1) >
            9 - this.numCardsLostInSuit(suit2)
          ) {
            return true
          }
          if (this.playedAllCardsInSuit(suit2)) {
            return (
              this.numCardsWonInSuit(suit1) === this.numCardsWonInSuit(suit2)
            )
          }
          return false
        }
        case '=':
          return (
            this.playedAllCardsInSuit(suit1) &&
            this.playedAllCardsInSuit(suit2) &&
            this.numCardsWonInSuit(suit1) === this.numCardsWonInSuit(suit2)
          )
      }
    }
    if (mission.lastNTricks) {
      // TODO: implement trick order
    }
    if (mission.xIsPublic) {
      // TODO: implement choosing x
    }
    console.warn('unhandled mission', mission)
    return false
  }

  // IMPORTANT! assumes that passed(mission) is false
  private failed(mission: Mission): boolean {
    if (mission.willWin) {
      // I will win {willWin} (and not {wontWinCards})
      return (
        mission.willWin.some((card) => this.lostCard(card)) ||
        !!mission.wontWinCards?.some((card) => this.wonCard(card))
      )
    }
    if (mission.wontWinNumbers) {
      // I will win no {wontWinNumbers}
      return mission.wontWinNumbers.some((n) => this.wonNumber(n))
    }
    if (mission.wontWinColors) {
      // I will win no {wontWinColors}
      return mission.wontWinColors.some((color) => this.wonSuit(color))
    }
    if (mission.willWinWith) {
      // I will win with a {with} / I will win a {capturing} with {with}
      const { with: winWith, capturing: toCapture } = mission.willWinWith!
      if (toCapture && this.playedAllCardsForNumber(toCapture)) {
        return true
      }
      return this.playedAllCardsForNumber(winWith)
    }
    if (mission.willWinWithSub) {
      // I will win {willWinWithSub} with a sub
      return this.playedCard(mission.willWinWithSub)
    }
    if (mission.winNumber) {
      // I will win exactly/at least {count} # of {winNumber}
      const { target, count: countToWin, exact } = mission.winNumber!
      const countAllowedToLose = 4 - countToWin
      const numLost = this.numCardsLostForNumber(target)
      // Did we lose too many of the card we're supposed to get?
      if (numLost > countAllowedToLose) {
        return true
      }
      if (exact) {
        // Did we win too many of the card we're supposed to get?
        const numWon = this.numCardsWonForNumber(target)
        return numWon > countToWin
      }
      return false
    }
    if (mission.winSuit) {
      // I will win exactly/at least {count} # of cards in the {winSuit}
      return mission.winSuit!.some(({ suit, count: countToWin, exact }) => {
        const countAllowedToLose = this.numCardsInSuit(suit) - countToWin
        const numLost = this.numCardsLostInSuit(suit)
        // Did we lose too many of the suit we're supposed to get?
        if (numLost > countAllowedToLose) {
          return true
        }
        if (exact) {
          // Did we win too many of the suit we're supposed to get?
          const numWon = this.numCardsWonInSuit(suit)
          return numWon > countToWin
        }
        return false
      })
    }
    if (mission.numTricks !== undefined) {
      const numTricksRemaining =
        this.gameState.totalTricks - this.playedTricks.length
      return (
        this.wonTricks.length > mission.numTricks ||
        this.wonTricks.length + numTricksRemaining < mission.numTricks
      )
    }
    if (mission.firstNTricks) {
      // TODO: implement trick order
    }
    if (mission.noneOfTheFirst) {
      // TODO: implement trick order
    }
    if (mission.nInARow) {
      // TODO: implement trick order
    }
    if (mission.notNInARow) {
      // TODO: implement trick order
    }
    if (mission.notOpenWith) {
      // I will not open a trick with {notOpenWith}
      return mission.notOpenWith!.some((suit) =>
        this.playedTricks.some((trick) => this.ledTrickWithSuit(trick, suit)),
      )
    }
    if (mission.special === 'allInOne') {
      // I will win all the cards in at least one of the 4 colors
      return COLOR_SUITS.every((color) => this.numCardsLostInSuit(color) > 0)
    }
    if (mission.special === 'oneInAll') {
      // I will win at least one card of each color
      return COLOR_SUITS.every((color) => this.numCardsLostInSuit(color) === 9)
    }
    if (mission.comparison) {
      // In total, I will win {suit1} > {suit2} / In total, I will win {suit1} = {suit2}
      const [suit1, suit2] = mission.comparison.suits
      switch (mission.comparison.comparator) {
        case '>':
          return (
            // even if we win the rest of the cards in suit1, we still have more suit2 cards than suit1 cards
            this.numCardsWonInSuit(suit2) > 9 - this.numCardsLostInSuit(suit1)
          )
        case '=':
          return (
            // won too many cards in suit1; even if we won the rest of the cards in suit2, it wouldn't be enough
            this.numCardsWonInSuit(suit1) >
              9 - this.numCardsLostInSuit(suit2) ||
            // won too many cards in suit2; even if we won the rest of the cards in suit1, it wouldn't be enough
            this.numCardsWonInSuit(suit2) > 9 - this.numCardsLostInSuit(suit1)
          )
      }
    }
    if (mission.xIsPublic) {
      // TODO: implement choosing x
    }
    return this.isGameOver()
  }

  ////////////////////////////////////////////////

  private wonCard = (card: CardValue) => this.wonCards.includes(card)
  private lostCard = (card: CardValue) => this.lostCards.includes(card)
  private playedCard = (card: CardValue) => this.playedCards.includes(card)

  private wonNumber = (n: number) =>
    this.allCardsForNumber(n).some(this.wonCard)
  private wonSuit = (suit: SuitWithSubs) =>
    this.wonCards.some((card) => getSuit(card) === suit)

  private wonTrickWithNumber = (trick: Trick, n: number) => {
    const winner = findWinner(trick).card
    return !isSub(winner) && getNumber(winner) === n
  }

  private wonTrickWithSub = (trick: Trick) => isSub(findWinner(trick).card)

  private trickContainsCard = (trick: Trick, _card: CardValue) =>
    trick.some(({ card }) => card === _card)

  private trickContainsNumber = (trick: Trick, n: number) =>
    trick.some(({ card }) => !isSub(card) && getNumber(card) === n)

  private trickContainsSub = (trick: Trick) =>
    trick.some(({ card }) => isSub(card))

  private allCardsForNumber = (n: number): CardValue[] =>
    COLOR_SUITS.map((suit) => `${suit}${n}` as CardValue)

  private numCardsInSuit = (suit: SuitWithSubs) => (suit === 's' ? 4 : 9)

  private _numCountInCards = (cards: CardValue[], n: number) =>
    cards.filter((card) => !isSub(card) && getNumber(card) === n).length
  private _suitCountInCards = (cards: CardValue[], suit: SuitWithSubs) =>
    cards.filter((card) => getSuit(card) === suit).length

  private numCardsPlayedForNumber = (n: number) =>
    this._numCountInCards(this.playedCards, n)
  private numCardsWonForNumber = (n: number) =>
    this._numCountInCards(this.wonCards, n)
  private numCardsLostForNumber = (n: number) =>
    this._numCountInCards(this.lostCards, n)

  private numCardsPlayedInSuit = (suit: SuitWithSubs) =>
    this._suitCountInCards(this.playedCards, suit)
  private numCardsWonInSuit = (suit: SuitWithSubs) =>
    this._suitCountInCards(this.wonCards, suit)
  private numCardsLostInSuit = (suit: SuitWithSubs) =>
    this._suitCountInCards(this.lostCards, suit)

  private playedAllCardsInSuit = (suit: SuitWithSubs) =>
    this.numCardsPlayedInSuit(suit) === this.numCardsInSuit(suit)
  private wonAllCardsInSuit = (suit: SuitWithSubs) =>
    this.numCardsWonInSuit(suit) === this.numCardsInSuit(suit)
  private lostAllCardsInSuit = (suit: SuitWithSubs) =>
    this.numCardsLostInSuit(suit) === this.numCardsInSuit(suit)

  private playedAllCardsForNumber = (n: number) =>
    this.allCardsForNumber(n).every(this.playedCard)

  private lostAllCardsForNumber = (n: number) =>
    this.allCardsForNumber(n).every(this.lostCard)

  private ledTrickWithSuit = (trick: Trick, suit: SuitWithSubs) => {
    const lead = trick[0]
    return lead.position === this.player.seat && getSuit(lead.card) === suit
  }

  private sumOfTrick = (trick: Trick) => {
    return trick
      .map(({ card }) => getNumber(card))
      .reduce((partialSum, a) => partialSum + a, 0)
  }
}
