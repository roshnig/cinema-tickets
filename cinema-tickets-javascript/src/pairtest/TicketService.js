import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #ticketPaymentService = new TicketPaymentService();
  #seatReservationService = new SeatReservationService();

  constructor() {
    this.#ticketPaymentService = this.#ticketPaymentService;
    this.#seatReservationService = this.#seatReservationService;
  }

  _hasRequiredParams(accountId, ...ticketTypeRequests) {
    if (arguments.length < 2) {
      throw new InvalidPurchaseException("There should be minimum 2 arguments");
    } else if (ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException("There is no ticket requests");
    }
  }

  _countTicketsPerCategory(...ticketTypeRequests) {
    let ticketsPerCategory = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0,
    };
    ticketTypeRequests.forEach((ticket) => {
      if (ticketsPerCategory.hasOwnProperty(ticket.getTicketType())) {
        ticketsPerCategory[ticket.getTicketType()] += ticket.getNoOfTickets();
      }
    });
    return ticketsPerCategory;
  }

  _validateRequiredTicketsNos(...ticketTypeRequests) {
    // As per requirement max 20 tickets can be booked. Infant will not get seat but will get a ticket.
    const ticketsRequired = ticketTypeRequests.reduce(
      (acc, current) => acc + current.getNoOfTickets(),
      0
    );
    if (ticketsRequired < 1 || ticketsRequired > 20) {
      throw new InvalidPurchaseException(
        "Minimum 1 and Max 20 tickets can be booked at a time"
      );
    }
  }

  _validateTicketsRequirement(ticketsPerCategory) {
    //Adult ticket must be there, child and infant tickets can't be booked without adult ticket.
    if (ticketsPerCategory.ADULT === 0) {
      throw new InvalidPurchaseException(
        "Adult ticket must be there, child and infant tickets can't be booked without adult ticket."
      );
    }
  }

  _calculateRequiredSeats(...ticketTypeRequests) {
    // For Infant type, seat will not be allocated but ticket will be counted
    let requiredSeats = 0;
    for (let i = 0; i < ticketTypeRequests.length; i++) {
      let ticket = ticketTypeRequests[i];
      if (ticket.getTicketType() !== "INFANT") {
        requiredSeats += ticket.getNoOfTickets();
      }
    }
    return requiredSeats;
  }

  _calculateTotalAmount(...ticketTypeRequests) {
    // as per requirement, adult ticket price is 20, child tkt price is 10, and for infant its 0
    let totalAmount = 0;
    for (let i = 0; i < ticketTypeRequests.length; i++) {
      let ticket = ticketTypeRequests[i];
      if (ticket.getTicketType() !== "INFANT") {
        if (ticket.getTicketType() == "ADULT") {
          totalAmount += ticket.getNoOfTickets() * 20;
        }
        if (ticket.getTicketType() == "CHILD") {
          totalAmount += ticket.getNoOfTickets() * 10;
        }
      }
    }
    return totalAmount;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException
    try {
      this._hasRequiredParams(accountId, ...ticketTypeRequests);

      const ticketsReqPerCategory = this._countTicketsPerCategory(
        ...ticketTypeRequests
      );
      this._validateTicketsRequirement(ticketsReqPerCategory);
      this._validateRequiredTicketsNos(...ticketTypeRequests);

      const requiredSeats = this._calculateRequiredSeats(...ticketTypeRequests);
      this.#seatReservationService.reserveSeat(accountId, requiredSeats);

      const totalAmount = this._calculateTotalAmount(...ticketTypeRequests);
      this.#ticketPaymentService.makePayment(accountId, totalAmount);
    } catch (err) {
      //catch any error thrown by TicketTypeRequest or by third party services
      throw err;
    }
  }
}
