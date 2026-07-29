/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { randUser } from '../utils/index.js'

const user = randUser()

// sampleBoard() only ships a single card, so filtering would have nothing to discriminate
const filterBoard = {
	title: 'FilterBoard',
	color: '00ff00',
	stacks: [
		{
			title: 'TestList',
			cards: [
				{ title: 'Alpha task' },
				{ title: 'Beta task' },
				{ title: 'Gamma thing' },
			],
		},
	],
}

const otherBoard = {
	title: 'UnrelatedBoard',
	color: 'ff0000',
	stacks: [],
}

describe('Board filter', function() {
	let boardId

	before(function() {
		cy.createUser(user)
		cy.login(user)
		cy.createExampleBoard({ user, board: filterBoard }).then((board) => {
			boardId = board.id
		})
		cy.createExampleBoard({ user, board: otherBoard })
	})

	describe('On a board', function() {
		beforeEach(function() {
			cy.login(user)
			cy.visit(`/apps/deck/#/board/${boardId}`)
			cy.get('.board .card').should('have.length', 3)
		})

		it('Filters cards as you type', function() {
			cy.get('#deck-search-input').type('Alpha')

			cy.get('.board .card').should('have.length', 1)
			cy.get('.board .card:contains("Alpha task")').should('be.visible')
		})

		it('Restores all cards when the filter is cleared', function() {
			cy.get('#deck-search-input').type('Alpha')
			cy.get('.board .card').should('have.length', 1)

			cy.get('.board-filter .input-field__trailing-button').click()

			cy.get('#deck-search-input').should('have.value', '')
			cy.get('.board .card').should('have.length', 3)
		})

		it('Supports the title: prefix', function() {
			cy.get('#deck-search-input').type('title:Gamma')

			cy.get('.board .card').should('have.length', 1)
			cy.get('.board .card:contains("Gamma thing")').should('be.visible')
		})

		// Deliberately not asserting that focus lands on the field: core's unified search
		// also binds Ctrl+F and only yields on paths listed in its appHandlesSearchShortcut,
		// so the outcome depends on the server version. What Deck owns is that the handler
		// no longer throws — it used to call .focus() on an element that was never rendered.
		// Cypress fails a test on any uncaught exception, so this assertion is implicit.
		it('Handles Ctrl+F without throwing', function() {
			cy.get('body').type('{ctrl}f')

			cy.get('#deck-search-input').should('exist')
		})
	})

	describe('On the board list', function() {
		// Assert on the specific boards rather than on a total: a new user also gets Deck's
		// default "Welcome to Nextcloud Deck!" board, so the row count is not ours to predict.
		beforeEach(function() {
			cy.login(user)
			cy.visit('/apps/deck/#/board')
			cy.get(`.board-list-row:contains("${filterBoard.title}")`).should('be.visible')
			cy.get(`.board-list-row:contains("${otherBoard.title}")`).should('be.visible')
		})

		it('Filters boards by title', function() {
			cy.get('#deck-search-input').type('Unrelated')

			cy.get(`.board-list-row:contains("${otherBoard.title}")`).should('be.visible')
			cy.get(`.board-list-row:contains("${filterBoard.title}")`).should('not.exist')
		})

		it('Restores all boards when the filter is cleared', function() {
			cy.get('#deck-search-input').type('Unrelated')
			cy.get(`.board-list-row:contains("${filterBoard.title}")`).should('not.exist')

			cy.get('.board-filter .input-field__trailing-button').click()

			cy.get(`.board-list-row:contains("${filterBoard.title}")`).should('be.visible')
			cy.get(`.board-list-row:contains("${otherBoard.title}")`).should('be.visible')
		})
	})

	describe('On the upcoming overview', function() {
		beforeEach(function() {
			cy.login(user)
			cy.visit('/apps/deck/#/upcoming')
			cy.get('.controls').should('exist')
		})

		it('Has no filter input', function() {
			cy.get('#deck-search-input').should('not.exist')
		})

		// This is the view that used to throw a TypeError on every Ctrl+F, because the
		// input was never rendered anywhere. Cypress fails on uncaught exceptions.
		it('Handles Ctrl+F without throwing when there is no filter', function() {
			cy.get('body').type('{ctrl}f')

			cy.get('.controls').should('be.visible')
		})
	})
})
