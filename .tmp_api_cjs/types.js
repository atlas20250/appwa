"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
})(UserRole || (exports.UserRole = UserRole = {}));
var BillStatus;
(function (BillStatus) {
    BillStatus["UNPAID"] = "unpaid";
    BillStatus["PAID"] = "paid";
    BillStatus["OVERDUE"] = "overdue";
    BillStatus["PENDING_APPROVAL"] = "pending_approval";
})(BillStatus || (exports.BillStatus = BillStatus = {}));
