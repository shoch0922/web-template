const webpack = require("webpack");

module.exports = {
	mode: "development",
	entry: {
		main: "",
	},
	output: {
    	filename: "",
  	},
  	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: "ts-loader",
			},
		],
  },
  resolve: {
	  extensions: [".ts", ".js"],
  },
};
