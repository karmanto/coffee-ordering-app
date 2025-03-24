"use client";
import { useEffect, useState } from "react";
import Header from "../../components/header";
import { TabMenu } from "@/app/components/tabmenu";
import { MenuCards } from "@/app/components/menucards";
import { Spinner } from "flowbite-react";
import { Footer } from "@/app/components/footer";
import { ModalCard } from "@/app/components/modalcard";
import { PaymentCard } from "@/app/components/paymentcard";
import { VoucherPromo } from "@/app/components/voucherpromo";
import { Done } from "@/app/components/done";
import { OrderCart } from "@/app/components/ordercart";
import { motion as m } from "framer-motion";
import { fetchMenus, fetchCategories, fetchChairs, fetchDiscounts } from "@/app/api/route";

const $Page = ["Order", "Best Seller", "Cart", "Logout"];

export default function Order() {
  const [itemsOrder, setItemsOrder] = useState([]);
  const [itemsDiscount, setItemsDiscount] = useState([]);
  const [totalPrice, setTotalPrice] = useState({
    amount: 0,
    length: 0,
    discounted: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [customerTable, setCustomerTable] = useState("");
  const [menuCards, setMenuCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [approved, setApproved] = useState({
    value: false,
    alertBuy: false,
    alertChekout: false,
  });
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkout, setCheckout] = useState({
    order: [],
    totalPrice: 0,
    finalPrice: 0,
    payment: "",
  });
  const [radioChekced, setRadioChecked] = useState("gopay");
  const [done, setDone] = useState(false);

  const [skipMenus, setSkipMenus] = useState(0);
  const [hasMoreMenus, setHasMoreMenus] = useState(true);
  const limitMenus = 10;

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const loadMenus = async () => {
    setIsLoading(true);
    const data = await fetchMenus(skipMenus, limitMenus, selectedCategory);
    if (data && data.length < limitMenus) {
      setHasMoreMenus(false);
    }
    setItemsOrder((prev) => {
      const existingItems = {};
      prev.forEach((item) => {
        existingItems[item.id] = item;
      });
      const mergedData = data.map((newItem) => {
        if (existingItems[newItem.id]) {
          return { 
            ...newItem, 
            amount: existingItems[newItem.id].amount,
            notes: existingItems[newItem.id].notes
          };
        }
        return newItem;
      });
      const fetchedIds = new Set(data.map((item) => item.id));
      const remainingOldItems = prev.filter((item) => !fetchedIds.has(item.id));
      return [...mergedData, ...remainingOldItems];
    });
    setIsLoading(false);
  };

  const loadCategories = async () => {
    const data = await fetchCategories();
    data.sort((a, b) => a.id - b.id);
    setCategories(data);
  };

  const loadDiscounts = async () => {
    const data = await fetchDiscounts();
    console.log("discounts", data);
    setItemsDiscount(data);
  };

  const loadChairs = async (uuid) => {
    const data = await fetchChairs(uuid);

    if (data) {
      setCustomerTable(data.id);
    }
  };

  useEffect(() => {
    loadMenus();
  }, [skipMenus, selectedCategory]);

  useEffect(() => {
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    const tableUUID = params.get("uuid"); 

    if (tableUUID) { 
      loadChairs(tableUUID);
    }

    loadCategories();
    loadDiscounts();
  }, []);

  useEffect(() => {
    if (currentPage === 0 || currentPage === 1) {
      setApproved({ value: false, alertBuy: false, alertChekout: false });
    }
  }, [currentPage]);

  useEffect(() => {
    setTotalPrice((t) => ({ ...t, discounted: totalPrice.amount }));
  }, [totalPrice.amount]);

  useEffect(() => {
    const discountedPrice = (totalPrice.amount * discountAmount) / 100;
    setTotalPrice((prev) => ({
      ...prev,
      discounted: totalPrice.amount - discountedPrice,
    }));
  }, [discountAmount]);

  const tabMenuHandler = (e) => {
    e.preventDefault();
    const categoryName = e.target.innerText;
    console.log("category name", categoryName);
    console.log("categories", categories);
    if (categoryName === "All") {
      setSelectedCategory(null);
      setMenuCards(0);
    } else {
      const category = categories.find(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (category) {
        setSelectedCategory(category.id);
        setMenuCards(category.id);
      }
    }
    setSkipMenus(0);
    setHasMoreMenus(true);
  };

  const plusButtonHandler = (e, idButton = null) => {
    e.preventDefault();
    const filteredItems = itemsOrder.map((data) => {
      if (idButton) {
        if (data.id === idButton) {
          setTotalPrice((prev) => ({
            ...prev,
            amount: prev.amount + data.price,
            length: prev.length + 1,
          }));
          setApproved({ ...approved, value: false });
          setDiscountAmount(0);
          return { ...data, amount: data.amount + 1 };
        }
      }
      if (data.id === e.target.id) {
        setTotalPrice((prev) => ({
          ...prev,
          amount: prev.amount + data.price,
          length: prev.length + 1,
        }));
        setApproved({ ...approved, alertChekout: false });
        setDiscountAmount(0);
        return { ...data, amount: data.amount + 1 };
      }
      return data;
    });
    setItemsOrder(filteredItems);
  };

  const minusButtonHandler = (e, idButton = null) => {
    e.preventDefault();
    const filteredItems = itemsOrder.map((data) => {
      if (idButton) {
        if (data.id === idButton && data.amount > 0) {
          setTotalPrice((prev) => ({
            ...prev,
            amount: prev.amount - data.price,
            length: prev.length - 1,
          }));
          setApproved({ ...approved, value: false });
          setDiscountAmount(0);
          if (totalPrice.length === 1 && currentPage === 2) {
            setCurrentPage(0);
            setMenuCards(0);
          }
          if (data.amount === 1) {
            return { ...data, amount: data.amount - 1, notes: "" };
          }
          return { ...data, amount: data.amount - 1 };
        }
      }
      if (data.id === e.target.id && data.amount > 0) {
        setTotalPrice((prev) => ({
          ...prev,
          amount: prev.amount - data.price,
          length: prev.length - 1,
        }));
        setDiscountAmount(0);
        return { ...data, amount: data.amount - 1 };
      }
      return data;
    });
    setItemsOrder(filteredItems);
  };

  const deleteItemHandler = (e, idButton = null) => {
    e.preventDefault();
    const filteredItems = itemsOrder.map((data) => {
      if (idButton) {
        if (data.id === idButton && data.amount > 0) {
          const dataPrice = data.amount * data.price;
          setTotalPrice((prev) => ({
            ...prev,
            amount: prev.amount - dataPrice,
            length: prev.length - data.amount,
          }));
          setApproved({ ...approved, value: false });
          setDiscountAmount(0);
          if (totalPrice.length === data.amount) {
            setCurrentPage(0);
            setMenuCards(0);
          }
          return { ...data, amount: 0, notes: "" };
        }
      }
      return data;
    });
    setItemsOrder(filteredItems);
  };

  const showModal = (e, dataId) => {
    e.preventDefault();
    setOpenModal(true);
    itemsOrder.forEach((data) => {
      if (data.id == e.target.id || data.id == dataId) {
        setDetailModal(data);
      }
    });
  };

  const closeModal = (e, modalId) => {
    const filteredItem = itemsOrder.map((data) => {
      if (data.id === modalId) {
        return { ...data, notes: detailModal?.notes };
      }
      return data;
    });
    setItemsOrder(filteredItem);
    setOpenModal(false);
  };

  const handleChange = (event) => {
    setRadioChecked(event.target.value);
  };

  const toggleHandler = (e) => {
    if (totalPrice.length !== 0) {
      setApproved({ ...approved, value: !approved.value, alertChekout: false });
    } else {
      setApproved({ ...approved, alertBuy: true });
    }
  };

  const footerHandler = () => {
    if (approved.value) {
      const updatedCheckout = itemsOrder.filter((item) => item.amount !== 0);
      setCheckout({
        order: updatedCheckout,
        totalPrice: totalPrice.amount,
        finalPrice: totalPrice.discounted,
        payment: radioChekced,
      });
      setDone(true);
    } else {
      setCurrentPage(2);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    if (currentPage === 2 && approved.value === false) {
      setApproved({ ...approved, alertChekout: true });
      window.scrollTo({
        top: 1000,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMoreMenus || isLoading) return;
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500
      ) {
        setSkipMenus((prev) => prev + limitMenus);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMoreMenus, isLoading]);

  return (
    <>
      <title>Coffee Ordering Mobile Web by Hassan Kaeru</title>
      {done ? (
        <Done
          checkout={checkout}
          discountAmount={discountAmount}
          totalPrice={totalPrice}
          table={customerTable}
        />
      ) : (
        <div className="z-30 flex w-full justify-center">
          <m.div className="flex max-w-[414px] justify-center font-sans">
            <Header
              table={customerTable ? customerTable : ""}
              page={$Page[currentPage]}
              totalPrice={totalPrice.length}
              onClickOrder={() => {
                setCurrentPage(0);
                setMenuCards(0);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onClickFavorite={() => {
                setCurrentPage(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onClickCart={() => {
                setCurrentPage(2);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
            {totalPrice.length !== 0 && (
              <Footer
                page={currentPage}
                totalPrice={totalPrice}
                onClick={footerHandler}
              />
            )}
            <div className="w-screen min-h-screen mt-[51px] bg-[#FFFFFF]">
              <div className="w-full max-w-[414px] p-3 pb-[62px] h-full space-y-3 overflow-hidden">
                {currentPage === 0 ? (
                  <>
                    <TabMenu
                      menusType={
                        categories.length
                          ? ["All", ...categories.map((category) => category.name)]
                          : ["All"]
                      }
                      menuCards={menuCards}
                      onClick={tabMenuHandler}
                    />
                    {isLoading && (
                      <m.div>
                        <div className="flex h-screen -mt-[108px] w-full justify-center items-center">
                          <Spinner color="success" aria-label="Loading spinner" />
                        </div>
                      </m.div>
                    )}
                    <m.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="z-10 grid grid-cols-1 gap-2"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {(selectedCategory
                          ? itemsOrder.filter(
                              (item) => item.categoryId === selectedCategory
                            )
                          : itemsOrder
                        ).map((data, idx) => (
                          <MenuCards
                            key={idx}
                            onClickModal={showModal}
                            data={data}
                            onClickMinus={minusButtonHandler}
                            onClickPlus={plusButtonHandler}
                          />
                        ))}
                      </div>
                    </m.div>
                  </>
                ) : currentPage === 1 ? (
                  <m.div
                    initial={{ x: "100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {itemsOrder.map((data, idx) =>
                      data.favorite ? (
                        <MenuCards
                          key={idx}
                          onClickModal={showModal}
                          data={data}
                          onClickMinus={minusButtonHandler}
                          onClickPlus={plusButtonHandler}
                        />
                      ) : null
                    )}
                  </m.div>
                ) : (
                  currentPage === 2 && (
                    <div className="flex flex-col">
                      <m.div
                        initial={{ x: "100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex flex-col"
                      >
                        {totalPrice.amount !== 0 && (
                          <>
                            <OrderCart
                              itemsOrder={itemsOrder}
                              minusButtonHandler={minusButtonHandler}
                              plusButtonHandler={plusButtonHandler}
                              setCurrentPage={setCurrentPage}
                              deleteItemHandler={deleteItemHandler}
                              showModal={showModal}
                            />
                            <VoucherPromo
                              discountList={itemsDiscount}
                              totalPrice={totalPrice}
                              setTotalPrice={setTotalPrice}
                              discountAmount={discountAmount}
                              setDiscountAmount={setDiscountAmount}
                              onClick={() => {
                                setCurrentPage(2);
                                window.scrollTo({
                                  top: 1000,
                                  behavior: "smooth",
                                });
                              }}
                            />
                          </>
                        )}
                      </m.div>
                      <m.div
                        initial={{ x: "100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <PaymentCard
                          radioChekced={radioChekced}
                          setRadioChecked={setRadioChecked}
                          handleChange={handleChange}
                          totalPrice={totalPrice}
                          onChange={toggleHandler}
                          checked={approved.value}
                          showAlertBuy={approved.alertBuy}
                          showAlertChekout={approved.alertChekout}
                          onClickToMenu={() => setCurrentPage(0)}
                          discountAmount={discountAmount}
                        />
                      </m.div>
                    </div>
                  )
                )}
              </div>
              <ModalCard
                detailModal={detailModal}
                show={openModal}
                setDetailModal={setDetailModal}
                onClick={(e) => closeModal(e, detailModal?.id)}
                onClose={(e) => closeModal(e, detailModal?.id)}
                autoFocus={false}
              />
            </div>
          </m.div>
        </div>
      )}
    </>
  );
}
