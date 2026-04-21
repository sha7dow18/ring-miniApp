const contentService = require("../../services/contentService.js");

Component({
  properties: {
    item: { type: Object, value: {} }
  },

  computed: {},

  data: { typeText: "" },

  observers: {
    "item": function(v) {
      this.setData({ typeText: contentService.typeLabel((v && v.type) || "") });
    }
  },

  methods: {
    onTap() {
      this.triggerEvent("tap", { item: this.data.item });
    }
  }
});
