import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";
import TicketService from "../src/pairtest/TicketService";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService";

jest.mock("../src/thirdparty/seatbooking/SeatReservationService");
jest.mock("../src/thirdparty/paymentgateway/TicketPaymentService");

beforeEach(() => {
  TicketPaymentService.mockClear();
  SeatReservationService.mockClear();
});

describe("Ticket Service()", () => {
  describe("PurchaseTicket() method : valid arguments are being passed", () => {
    it("should throw InvalidPurchaseException if no arguments are being passed in purchase ticket method", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets();
      }).toThrow(InvalidPurchaseException);
    });

    it("should throw an error if less than 2 arguments are being passed in purchase ticket method", () => {
      const ticketService = new TicketService();
      const ticketRequest = new TicketTypeRequest("ADULT", 1);
      expect(() => {
        ticketService.purchaseTickets(1);
      }).toThrow(InvalidPurchaseException);
      expect(() => {
        ticketService.purchaseTickets(ticketRequest);
      }).toThrow(InvalidPurchaseException);
    });

    it("should throw TypeError, if noOfTickets is not an integer in ticketTypeRequests", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets(1, new TicketTypeRequest("ADULT", "1"));
      }).toThrow(TypeError);
    });

    it("should throw TypeError, if type is not 'ADULT' or 'CHILD' or 'INFANT' in ticketTypeRequests", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets(1, new TicketTypeRequest("ADULTyuu", 1));
      }).toThrow(TypeError);
    });

    it("should throw TypeError, if accountId is not an integer", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets("1", new TicketTypeRequest("ADULT", "1"));
      }).toThrow(TypeError);
    });

    it("It should not throw any error if all arguments being passed in purchase ticket method are correct", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets(1, new TicketTypeRequest("ADULT", 1));
      }).not.toThrow(TypeError);
      expect(() => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest("ADULT", 1),
          new TicketTypeRequest("CHILD", 2)
        );
      }).not.toThrow(TypeError);
    });
  });

  describe("PurchaseTicket() method : validate ticket type requests", () => {
    it("should throw InvalidPurchaseException, if no adult seat request is there in ticketTypeRequests", () => {
      const ticketService = new TicketService();

      expect(() => {
        ticketService.purchaseTickets(1, new TicketTypeRequest("CHILD", 1));
      }).toThrow(InvalidPurchaseException);

      expect(() => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest("ADULT", 0),
          new TicketTypeRequest("CHILD", 1)
        );
      }).toThrow(InvalidPurchaseException);
    });

    it("should not throw error, if adult type seat is there in ticketTypeRequests", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest("ADULT", 1),
          new TicketTypeRequest("CHILD", 1)
        );
      }).not.toThrow(InvalidPurchaseException);
    });
  });

  describe("PurchaseTicket() method : validate no of tickets being requested", () => {
    it("should throw InvalidPurchaseException if 0 tickets are being requested", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest("ADULT", 0),
          new TicketTypeRequest("CHILD", 0)
        );
      }).toThrow(InvalidPurchaseException);
    });

    it("should throw InvalidPurchaseException if more than 20 tickets are being requested", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest("ADULT", 20),
          new TicketTypeRequest("CHILD", 30)
        );
      }).toThrow(InvalidPurchaseException);
    });

    it("should not throw errors if more than 0 and less than 21 tickets are being requested", () => {
      const ticketService = new TicketService();
      expect(() => {
        ticketService.purchaseTickets(
          1,
          new TicketTypeRequest("ADULT", 18),
          new TicketTypeRequest("CHILD", 2)
        );
      }).not.toThrow(InvalidPurchaseException);
    });
  });

  describe("Make a request for seat reservation", () => {
    it("should call seat reservation service with correct number of seats. Infant seat should not be counted", () => {
      const ticketRequest1 = new TicketTypeRequest("ADULT", 2);
      const ticketRequest2 = new TicketTypeRequest("CHILD", 2);
      const ticketRequest3 = new TicketTypeRequest("INFANT", 1);

      const ticketService = new TicketService();
      ticketService.purchaseTickets(
        1,
        ticketRequest1,
        ticketRequest2,
        ticketRequest3
      );

      const mockInstance = SeatReservationService.mock.instances[0];
      const mockReserveSeatMethod = mockInstance.reserveSeat;

      expect(mockReserveSeatMethod).toHaveBeenCalled();
      expect(mockReserveSeatMethod).toHaveBeenCalledTimes(1);
      expect(mockReserveSeatMethod).toHaveBeenCalledWith(1, 4); //only adult and chil seats should be counted
      expect(mockReserveSeatMethod).not.toHaveBeenCalledWith(1, 5); //infant seat should not be counted
    });
  });

  describe("call to TicketPaymentService", () => {
    it("should call TicketPaymentService with correct amount.", () => {
      const ticketRequest1 = new TicketTypeRequest("ADULT", 2);
      const ticketRequest2 = new TicketTypeRequest("CHILD", 2);
      const ticketRequest3 = new TicketTypeRequest("INFANT", 1);

      const ticketService = new TicketService();
      ticketService.purchaseTickets(
        1,
        ticketRequest1,
        ticketRequest2,
        ticketRequest3
      );

      const mockInstance = TicketPaymentService.mock.instances[0];
      const mockMakePaymentMethod = mockInstance.makePayment;

      expect(mockMakePaymentMethod).toHaveBeenCalled();
      expect(mockMakePaymentMethod).toHaveBeenCalledTimes(1);
      expect(mockMakePaymentMethod).toHaveBeenCalledWith(1, 60); // adult -20 and child 10
      expect(mockMakePaymentMethod).not.toHaveBeenCalledWith(1, 70);
    });
  });
});
