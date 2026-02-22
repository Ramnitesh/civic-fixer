import { useState } from "react";
import { Link } from "wouter";
import { useWallet } from "../hooks/use-wallet";
import { Navigation } from "../components/Navigation";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Loader2,
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  History,
  CreditCard,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export default function WalletPage() {
  const {
    wallet,
    transactions,
    withdrawals,
    isLoadingWallet,
    isLoadingTransactions,
    addMoney,
    requestWithdrawal,
    isAddingMoney,
    isWithdrawing,
  } = useWallet();
  const { toast } = useToast();
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const handleAddMoney = (amount: number) => {
    addMoney(amount, {
      onSuccess: (data) => {
        toast({
          title: "Money Added",
          description: `Order created for ₹${amount}. Complete payment to add money to wallet.`,
        });
        setAddMoneyOpen(false);
        setSelectedAmount(null);
        setCustomAmount("");
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (wallet && amount > wallet.availableBalance) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    requestWithdrawal(
      {
        amount,
        bankAccount: {
          accountNumber,
          ifsc,
          accountHolderName,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Withdrawal Requested",
            description:
              "Your withdrawal request has been submitted for approval.",
          });
          setWithdrawOpen(false);
          setWithdrawAmount("");
          setAccountNumber("");
          setIfsc("");
          setAccountHolderName("");
        },
        onError: (error: Error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const formatDate = (dateStr: string) => {
    // Display in UTC timezone exactly as stored
    const isoStr = dateStr.includes("Z") ? dateStr : dateStr + "Z";
    return new Date(isoStr).toLocaleString("en-IN", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatAmount = (amount: number, showSign = false) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

    if (showSign) {
      return amount >= 0 ? `+${formatted}` : formatted;
    }
    return formatted;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case "CONTRIBUTION":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "REFUND":
        return <ArrowDownRight className="h-4 w-4 text-purple-500" />;
      case "FEE":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "WITHDRAWAL":
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "PAID":
      case "APPROVED":
        return "text-green-600";
      case "PENDING":
      case "PROCESSING":
        return "text-yellow-600";
      case "FAILED":
      case "REJECTED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (isLoadingWallet) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Wallet</h1>
            <p className="text-muted-foreground">
              Manage your wallet and transactions
            </p>
          </div>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Card className="py-1">
            <CardTitle className="text-xs font-medium text-muted-foreground px-3">
              Available
            </CardTitle>
            <CardContent className="pt-1 pb-2 px-3">
              <div className="text-lg font-bold text-black-600">
                {formatAmount(wallet?.availableBalance || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="py-1">
            <CardTitle className="text-xs font-medium text-muted-foreground px-3">
              Frozen
            </CardTitle>
            <CardContent className="pt-1 pb-2 px-3">
              <div className="text-lg font-bold text-blue-600">
                {formatAmount(wallet?.frozenBalance || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="py-1">
            <CardTitle className="text-xs font-medium text-muted-foreground px-3">
              Deposited
            </CardTitle>
            <CardContent className="pt-1 pb-2 px-3">
              <div className="text-lg font-bold text-green-600">
                {formatAmount(wallet?.totalDeposited || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="py-1">
            <CardTitle className="text-xs font-medium text-muted-foreground px-3">
              Spent
            </CardTitle>
            <CardContent className="pt-1 pb-2 px-3">
              <div className="text-lg font-bold text-red-600">
                {formatAmount(wallet?.totalSpent || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Dialog open={addMoneyOpen} onOpenChange={setAddMoneyOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Money
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Money to Wallet</DialogTitle>
                <DialogDescription>
                  Choose an amount to add to your wallet
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant={
                        selectedAmount === amount ? "default" : "outline"
                      }
                      onClick={() => setSelectedAmount(amount)}
                      disabled={isAddingMoney}
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Or enter custom amount (min ₹100)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    min={100}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    const amount = selectedAmount || parseFloat(customAmount);
                    if (amount >= 100) {
                      handleAddMoney(amount);
                    } else {
                      toast({
                        title: "Error",
                        description: "Minimum amount is ₹100",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={isAddingMoney || (!selectedAmount && !customAmount)}
                >
                  {isAddingMoney && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Money
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Wallet className="h-4 w-4" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw to Bank</DialogTitle>
                <DialogDescription>
                  Available: {formatAmount(wallet?.availableBalance || 0)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    placeholder="Enter name"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    placeholder="Enter IFSC code"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleWithdraw}
                  disabled={
                    isWithdrawing ||
                    !withdrawAmount ||
                    !accountNumber ||
                    !ifsc ||
                    !accountHolderName
                  }
                >
                  {isWithdrawing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Request Withdrawal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transactions & Withdrawals Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList>
            <TabsTrigger value="transactions" className="gap-2">
              <History className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <Wallet className="h-4 w-4" />
              Withdrawals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your recent wallet transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions yet
                  </div>
                ) : (
                  <Table>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id} className="h-12">
                          <TableCell className="py-1 px-1">
                            <div className="flex items-center justify-center">
                              {getTransactionIcon(tx.type)}
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-1">
                            <div className="flex flex-col py-1">
                              {(() => {
                                // Try to get jobId from tx.jobId or extract from description
                                const jobId =
                                  tx.jobId ||
                                  (tx.description
                                    ? parseInt(
                                        tx.description.match(
                                          /Job\s*#(\d+)/,
                                        )?.[1] || "0",
                                      )
                                    : 0);
                                if (jobId > 0) {
                                  return (
                                    <Link
                                      to={`/jobs/${jobId}`}
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      {tx.description || "-"}
                                    </Link>
                                  );
                                }
                                return (
                                  <span className="text-sm">
                                    {tx.description || "-"}
                                  </span>
                                );
                              })()}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(tx.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-1">
                            <div className="flex flex-col items-end py-1">
                              <span
                                className={`whitespace-nowrap ${
                                  tx.type === "DEPOSIT" || tx.type === "REFUND"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {(tx.type === "DEPOSIT" || tx.type === "REFUND"
                                  ? "+"
                                  : "-") +
                                  formatAmount(tx.amount).replace(/^[+-]/, "")}
                              </span>
                              <span
                                className={`text-[10px] ${getStatusColor(tx.status)}`}
                              >
                                {tx.status}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
                <CardDescription>Your withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No withdrawal requests
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Processed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="font-medium">
                            {formatAmount(withdrawal.amount)}
                          </TableCell>
                          <TableCell
                            className={getStatusColor(withdrawal.status)}
                          >
                            {withdrawal.status}
                          </TableCell>
                          <TableCell>
                            {formatDate(withdrawal.createdAt)}
                          </TableCell>
                          <TableCell>
                            {withdrawal.processedAt
                              ? formatDate(withdrawal.processedAt)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
